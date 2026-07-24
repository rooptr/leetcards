const STM32_SUPPORT = String.raw`
/*
 * Target: NUCLEO-F446RE, STM32CubeF4 HAL, 16 MHz HSI.
 * External trainer-board profile:
 *   PC0..PC7  -> eight LEDs or seven-segment a..dp through resistors
 *   PB0, PB1, PB2, PB10 -> four active-low digit enables
 *   PB12..PB15 -> four active-low switches
 *   PA0 -> potentiometer or LM35 (ADC1_IN0)
 *   PA6 -> PWM output (TIM3_CH1)
 *   PA2/PA3 -> USART2 TX/RX through ST-LINK virtual COM port
 *   PB8/PB9 -> I2C1 SCL/SDA with external pull-ups
 *   PA8..PA11 -> HD44780 D4..D7, PA12 -> RS, PA15 -> EN
 * SWD remains on PA13/PA14. Adapt only the board layer for another PCB.
 * The flash helpers reserve sector 7 at 0x08060000. In the GNU linker
 * script, set FLASH LENGTH to 384K so application code cannot enter it.
 */
#include "stm32f4xx_hal.h"
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

TIM_HandleTypeDef htim2;
TIM_HandleTypeDef htim3;
TIM_HandleTypeDef htim4;
ADC_HandleTypeDef hadc1;
UART_HandleTypeDef huart2;
I2C_HandleTypeDef hi2c1;

static const uint8_t segment_lut[16] = {
    0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07,
    0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71
};
static const uint16_t digit_pins[4] = {
    GPIO_PIN_0, GPIO_PIN_1, GPIO_PIN_2, GPIO_PIN_10
};

static void fatal(void) {
    __disable_irq();
    for (;;) {}
}

static void clock_init(void) {
    RCC_OscInitTypeDef oscillator = {0};
    RCC_ClkInitTypeDef clocks = {0};
    __HAL_RCC_PWR_CLK_ENABLE();
    __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE2);
    oscillator.OscillatorType = RCC_OSCILLATORTYPE_HSI;
    oscillator.HSIState = RCC_HSI_ON;
    oscillator.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
    oscillator.PLL.PLLState = RCC_PLL_NONE;
    if (HAL_RCC_OscConfig(&oscillator) != HAL_OK) fatal();
    clocks.ClockType = RCC_CLOCKTYPE_SYSCLK | RCC_CLOCKTYPE_HCLK |
                       RCC_CLOCKTYPE_PCLK1 | RCC_CLOCKTYPE_PCLK2;
    clocks.SYSCLKSource = RCC_SYSCLKSOURCE_HSI;
    clocks.AHBCLKDivider = RCC_SYSCLK_DIV1;
    clocks.APB1CLKDivider = RCC_HCLK_DIV1;
    clocks.APB2CLKDivider = RCC_HCLK_DIV1;
    if (HAL_RCC_ClockConfig(&clocks, FLASH_LATENCY_0) != HAL_OK) fatal();
}

static void gpio_init(void) {
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();
    __HAL_RCC_GPIOC_CLK_ENABLE();

    GPIO_InitTypeDef gpio = {0};
    gpio.Pin = GPIO_PIN_All;
    gpio.Mode = GPIO_MODE_OUTPUT_PP;
    gpio.Pull = GPIO_NOPULL;
    gpio.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(GPIOC, &gpio);

    gpio.Pin = GPIO_PIN_0 | GPIO_PIN_1 | GPIO_PIN_2 | GPIO_PIN_10;
    HAL_GPIO_Init(GPIOB, &gpio);
    HAL_GPIO_WritePin(GPIOB, gpio.Pin, GPIO_PIN_SET);

    gpio.Pin = GPIO_PIN_8 | GPIO_PIN_9 | GPIO_PIN_10 | GPIO_PIN_11 |
               GPIO_PIN_12 | GPIO_PIN_15;
    HAL_GPIO_Init(GPIOA, &gpio);

    gpio.Pin = GPIO_PIN_12 | GPIO_PIN_13 | GPIO_PIN_14 | GPIO_PIN_15;
    gpio.Mode = GPIO_MODE_INPUT;
    gpio.Pull = GPIO_PULLUP;
    HAL_GPIO_Init(GPIOB, &gpio);
}

static void board_init(void) {
    HAL_Init();
    clock_init();
    gpio_init();
}

static uint8_t key_event(void) {
    static uint8_t stable = 0x0F;
    static uint8_t candidate = 0x0F;
    static uint32_t changed_at;
    uint8_t sample = 0;
    for (uint8_t index = 0; index < 4; ++index) {
        if (HAL_GPIO_ReadPin(GPIOB, (uint16_t)(GPIO_PIN_12 << index)) == GPIO_PIN_SET)
            sample |= (uint8_t)(1u << index);
    }
    if (sample != candidate) {
        candidate = sample;
        changed_at = HAL_GetTick();
    }
    if (sample != stable && HAL_GetTick() - changed_at >= 20u) {
        uint8_t previous = stable;
        stable = sample;
        if (previous == 0x0F && stable != 0x0F) {
            for (uint8_t index = 0; index < 4; ++index)
                if ((stable & (1u << index)) == 0) return index;
        }
    }
    return 0xFF;
}

static void leds_write(uint8_t value) {
    GPIOC->BSRR = ((uint32_t)(~value & 0xFFu) << 16) | value;
}

static void ssd_scan_raw(const uint8_t segments[4]) {
    for (uint8_t position = 0; position < 4; ++position) {
        HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0 | GPIO_PIN_1 | GPIO_PIN_2 | GPIO_PIN_10, GPIO_PIN_SET);
        leds_write(segments[position]);
        HAL_GPIO_WritePin(GPIOB, digit_pins[position], GPIO_PIN_RESET);
        HAL_Delay(2);
    }
}

static void ssd_scan_digits(const uint8_t digits[4], uint8_t decimal_mask) {
    uint8_t segments[4];
    for (uint8_t index = 0; index < 4; ++index)
        segments[index] = segment_lut[digits[index] & 0x0F] |
                          ((decimal_mask & (1u << index)) ? 0x80u : 0u);
    ssd_scan_raw(segments);
}

static void digits_from_u16(uint16_t value, uint8_t digits[4]) {
    digits[3] = (uint8_t)(value % 10u); value /= 10u;
    digits[2] = (uint8_t)(value % 10u); value /= 10u;
    digits[1] = (uint8_t)(value % 10u); value /= 10u;
    digits[0] = (uint8_t)(value % 10u);
}

static void timer_base_init(
    TIM_HandleTypeDef *timer,
    TIM_TypeDef *instance,
    uint32_t tick_hz
) {
    if (instance == TIM2) __HAL_RCC_TIM2_CLK_ENABLE();
    if (instance == TIM3) __HAL_RCC_TIM3_CLK_ENABLE();
    if (instance == TIM4) __HAL_RCC_TIM4_CLK_ENABLE();
    timer->Instance = instance;
    timer->Init.Prescaler = 15999;
    timer->Init.CounterMode = TIM_COUNTERMODE_UP;
    timer->Init.Period = (1000u / tick_hz) - 1u;
    timer->Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
    timer->Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
    if (HAL_TIM_Base_Init(timer) != HAL_OK) fatal();
    IRQn_Type irq = instance == TIM2 ? TIM2_IRQn : instance == TIM3 ? TIM3_IRQn : TIM4_IRQn;
    HAL_NVIC_SetPriority(irq, 5, 0);
    HAL_NVIC_EnableIRQ(irq);
}

static void pwm_init(void) {
    __HAL_RCC_TIM3_CLK_ENABLE();
    GPIO_InitTypeDef gpio = {0};
    gpio.Pin = GPIO_PIN_6;
    gpio.Mode = GPIO_MODE_AF_PP;
    gpio.Pull = GPIO_NOPULL;
    gpio.Speed = GPIO_SPEED_FREQ_HIGH;
    gpio.Alternate = GPIO_AF2_TIM3;
    HAL_GPIO_Init(GPIOA, &gpio);
    htim3.Instance = TIM3;
    htim3.Init.Prescaler = 15;
    htim3.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim3.Init.Period = 999;
    htim3.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
    htim3.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_ENABLE;
    if (HAL_TIM_PWM_Init(&htim3) != HAL_OK) fatal();
    TIM_OC_InitTypeDef channel = {0};
    channel.OCMode = TIM_OCMODE_PWM1;
    channel.Pulse = 500;
    channel.OCPolarity = TIM_OCPOLARITY_HIGH;
    channel.OCFastMode = TIM_OCFAST_DISABLE;
    if (HAL_TIM_PWM_ConfigChannel(&htim3, &channel, TIM_CHANNEL_1) != HAL_OK) fatal();
    if (HAL_TIM_PWM_Start(&htim3, TIM_CHANNEL_1) != HAL_OK) fatal();
}

static void adc_init(void) {
    __HAL_RCC_ADC1_CLK_ENABLE();
    GPIO_InitTypeDef gpio = {0};
    gpio.Pin = GPIO_PIN_0;
    gpio.Mode = GPIO_MODE_ANALOG;
    gpio.Pull = GPIO_NOPULL;
    HAL_GPIO_Init(GPIOA, &gpio);
    hadc1.Instance = ADC1;
    hadc1.Init.ClockPrescaler = ADC_CLOCK_SYNC_PCLK_DIV4;
    hadc1.Init.Resolution = ADC_RESOLUTION_12B;
    hadc1.Init.ScanConvMode = DISABLE;
    hadc1.Init.ContinuousConvMode = DISABLE;
    hadc1.Init.DiscontinuousConvMode = DISABLE;
    hadc1.Init.ExternalTrigConvEdge = ADC_EXTERNALTRIGCONVEDGE_NONE;
    hadc1.Init.ExternalTrigConv = ADC_SOFTWARE_START;
    hadc1.Init.DataAlign = ADC_DATAALIGN_RIGHT;
    hadc1.Init.NbrOfConversion = 1;
    hadc1.Init.DMAContinuousRequests = DISABLE;
    hadc1.Init.EOCSelection = ADC_EOC_SINGLE_CONV;
    if (HAL_ADC_Init(&hadc1) != HAL_OK) fatal();
    ADC_ChannelConfTypeDef channel = {0};
    channel.Channel = ADC_CHANNEL_0;
    channel.Rank = 1;
    channel.SamplingTime = ADC_SAMPLETIME_144CYCLES;
    if (HAL_ADC_ConfigChannel(&hadc1, &channel) != HAL_OK) fatal();
}

static uint16_t adc_read(void) {
    if (HAL_ADC_Start(&hadc1) != HAL_OK) fatal();
    if (HAL_ADC_PollForConversion(&hadc1, 20) != HAL_OK) fatal();
    uint16_t result = (uint16_t)HAL_ADC_GetValue(&hadc1);
    HAL_ADC_Stop(&hadc1);
    return result;
}

static void uart_init(void) {
    __HAL_RCC_USART2_CLK_ENABLE();
    GPIO_InitTypeDef gpio = {0};
    gpio.Pin = GPIO_PIN_2 | GPIO_PIN_3;
    gpio.Mode = GPIO_MODE_AF_PP;
    gpio.Pull = GPIO_PULLUP;
    gpio.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    gpio.Alternate = GPIO_AF7_USART2;
    HAL_GPIO_Init(GPIOA, &gpio);
    huart2.Instance = USART2;
    huart2.Init.BaudRate = 115200;
    huart2.Init.WordLength = UART_WORDLENGTH_8B;
    huart2.Init.StopBits = UART_STOPBITS_1;
    huart2.Init.Parity = UART_PARITY_NONE;
    huart2.Init.Mode = UART_MODE_TX_RX;
    huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
    huart2.Init.OverSampling = UART_OVERSAMPLING_16;
    if (HAL_UART_Init(&huart2) != HAL_OK) fatal();
}

static void uart_text(const char *text) {
    if (HAL_UART_Transmit(&huart2, (uint8_t *)text, (uint16_t)strlen(text), 1000) != HAL_OK)
        fatal();
}

static char uart_get(void) {
    char value;
    if (HAL_UART_Receive(&huart2, (uint8_t *)&value, 1, HAL_MAX_DELAY) != HAL_OK) fatal();
    return value;
}

static void i2c_init(void) {
    __HAL_RCC_I2C1_CLK_ENABLE();
    GPIO_InitTypeDef gpio = {0};
    gpio.Pin = GPIO_PIN_8 | GPIO_PIN_9;
    gpio.Mode = GPIO_MODE_AF_OD;
    gpio.Pull = GPIO_PULLUP;
    gpio.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    gpio.Alternate = GPIO_AF4_I2C1;
    HAL_GPIO_Init(GPIOB, &gpio);
    hi2c1.Instance = I2C1;
    hi2c1.Init.ClockSpeed = 100000;
    hi2c1.Init.DutyCycle = I2C_DUTYCYCLE_2;
    hi2c1.Init.OwnAddress1 = 0;
    hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
    hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
    hi2c1.Init.OwnAddress2 = 0;
    hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
    hi2c1.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;
    if (HAL_I2C_Init(&hi2c1) != HAL_OK) fatal();
}

static void eeprom24_write(uint8_t address, uint8_t value) {
    if (HAL_I2C_Mem_Write(&hi2c1, 0xA0, address, I2C_MEMADD_SIZE_8BIT, &value, 1, 100) != HAL_OK)
        fatal();
    HAL_Delay(6);
}

static uint8_t eeprom24_read(uint8_t address) {
    uint8_t value;
    if (HAL_I2C_Mem_Read(&hi2c1, 0xA0, address, I2C_MEMADD_SIZE_8BIT, &value, 1, 100) != HAL_OK)
        fatal();
    return value;
}

typedef struct {
    uint32_t magic;
    uint16_t value;
    uint16_t check;
} PersistedCounter;

#define STORE_ADDRESS ((uint32_t)0x08060000)
#define STORE_MAGIC ((uint32_t)0x4C434152)

static bool flash_load(uint16_t *value) {
    const PersistedCounter *record = (const PersistedCounter *)STORE_ADDRESS;
    if (record->magic != STORE_MAGIC || record->check != (uint16_t)(record->value ^ 0xA55A))
        return false;
    *value = record->value;
    return true;
}

static void flash_save(uint16_t value) {
    FLASH_EraseInitTypeDef erase = {0};
    uint32_t error_sector;
    erase.TypeErase = FLASH_TYPEERASE_SECTORS;
    erase.VoltageRange = FLASH_VOLTAGE_RANGE_3;
    erase.Sector = FLASH_SECTOR_7;
    erase.NbSectors = 1;
    PersistedCounter record = {STORE_MAGIC, value, (uint16_t)(value ^ 0xA55A)};
    HAL_FLASH_Unlock();
    if (HAL_FLASHEx_Erase(&erase, &error_sector) != HAL_OK) fatal();
    const uint32_t *words = (const uint32_t *)&record;
    for (uint32_t index = 0; index < sizeof(record) / sizeof(uint32_t); ++index)
        if (HAL_FLASH_Program(FLASH_TYPEPROGRAM_WORD, STORE_ADDRESS + index * 4u, words[index]) != HAL_OK)
            fatal();
    HAL_FLASH_Lock();
}

static void lcd_nibble(uint8_t nibble) {
    const uint16_t pins[4] = {GPIO_PIN_8, GPIO_PIN_9, GPIO_PIN_10, GPIO_PIN_11};
    for (uint8_t bit = 0; bit < 4; ++bit)
        HAL_GPIO_WritePin(GPIOA, pins[bit], (nibble & (1u << bit)) ? GPIO_PIN_SET : GPIO_PIN_RESET);
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_15, GPIO_PIN_SET);
    for (volatile uint32_t delay = 0; delay < 80; ++delay) {}
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_15, GPIO_PIN_RESET);
}

static void lcd_write(uint8_t value, bool data) {
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_12, data ? GPIO_PIN_SET : GPIO_PIN_RESET);
    lcd_nibble((uint8_t)(value >> 4));
    lcd_nibble((uint8_t)(value & 0x0F));
    HAL_Delay(2);
}

static void lcd_command(uint8_t command) { lcd_write(command, false); }
static void lcd_data(char value) { lcd_write((uint8_t)value, true); }

static void lcd_init(void) {
    HAL_Delay(20);
    lcd_nibble(0x03); HAL_Delay(5);
    lcd_nibble(0x03); HAL_Delay(1);
    lcd_nibble(0x03);
    lcd_nibble(0x02);
    lcd_command(0x28);
    lcd_command(0x0C);
    lcd_command(0x06);
    lcd_command(0x01);
}

static void lcd_text(const char *text) {
    while (*text != '\0') lcd_data(*text++);
}

void TIM2_IRQHandler(void) { HAL_TIM_IRQHandler(&htim2); }
void TIM3_IRQHandler(void) { HAL_TIM_IRQHandler(&htim3); }
void TIM4_IRQHandler(void) { HAL_TIM_IRQHandler(&htim4); }
`;

const program = ({ globals = '', helpers = '', callbacks = '', setup = '', loop }) =>
  `${STM32_SUPPORT}

${globals.trim()}
${helpers.trim()}
${callbacks.trim()}

int main(void) {
    board_init();
${setup.trim()}
    for (;;) {
${loop.trim()}
    }
}
`.trim();

export const stm32CollegeMcuSources = {
  'led-patterns': program({
    setup: `    uint8_t frame = 0x01;
    int8_t direction = 1;
    uint32_t next_frame = HAL_GetTick();`,
    loop: `        uint8_t mode = 0;
        for (uint8_t key = 0; key < 2; ++key)
            if (HAL_GPIO_ReadPin(GPIOB, (uint16_t)(GPIO_PIN_12 << key)) == GPIO_PIN_RESET)
                mode |= (uint8_t)(1u << key);
        uint8_t output = mode == 0 ? frame :
                         mode == 1 ? (uint8_t)(frame | (frame << 1)) :
                         mode == 2 ? (uint8_t)(0xAAu ^ frame) : (uint8_t)~frame;
        leds_write(output);
        if ((int32_t)(HAL_GetTick() - next_frame) >= 0) {
            next_frame += 120;
            if (direction > 0) {
                frame <<= 1;
                if (frame == 0) { frame = 0x80; direction = -1; }
            } else {
                frame >>= 1;
                if (frame == 0) { frame = 0x01; direction = 1; }
            }
        }`,
  }),
  'number-marquee': program({
    globals: `static const uint8_t message_digits[] = {1,2,3,4,5,6,7,8,9,0};`,
    setup: `    uint8_t origin = 0;
    bool right = false;
    uint32_t next_scroll = HAL_GetTick() + 350;`,
    loop: `        uint8_t key = key_event();
        if (key == 0) right = false;
        if (key == 1) right = true;
        uint8_t shown[4];
        for (uint8_t index = 0; index < 4; ++index)
            shown[index] = message_digits[(origin + index) % 10u];
        ssd_scan_digits(shown, 0);
        if ((int32_t)(HAL_GetTick() - next_scroll) >= 0) {
            next_scroll += 350;
            origin = right ? (uint8_t)((origin + 9u) % 10u) : (uint8_t)((origin + 1u) % 10u);
        }`,
  }),
  'key-counter-internal-eeprom': program({
    setup: `    uint16_t count = 0;
    flash_load(&count);
    bool dirty = false;
    uint32_t commit_at = 0;`,
    loop: `        uint8_t key = key_event();
        if (key == 0) { count = (uint16_t)((count + 1u) % 10000u); dirty = true; commit_at = HAL_GetTick() + 1000; }
        if (key == 1) { count = 0; dirty = true; commit_at = HAL_GetTick() + 1000; }
        uint8_t digits[4];
        digits_from_u16(count, digits);
        ssd_scan_digits(digits, 0);
        if (dirty && (int32_t)(HAL_GetTick() - commit_at) >= 0) {
            flash_save(count);
            dirty = false;
        }`,
  }),
  'sleep-wake': program({
    globals: `static volatile bool woke;`,
    helpers: `static void wake_exti_init(void) {
    GPIO_InitTypeDef gpio = {0};
    gpio.Pin = GPIO_PIN_13;
    gpio.Mode = GPIO_MODE_IT_FALLING;
    gpio.Pull = GPIO_PULLUP;
    HAL_GPIO_Init(GPIOC, &gpio);
    HAL_NVIC_SetPriority(EXTI15_10_IRQn, 5, 0);
    HAL_NVIC_EnableIRQ(EXTI15_10_IRQn);
}`,
    callbacks: `void EXTI15_10_IRQHandler(void) { HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_13); }
void HAL_GPIO_EXTI_Callback(uint16_t pin) { if (pin == GPIO_PIN_13) woke = true; }`,
    setup: `    wake_exti_init();`,
    loop: `        leds_write(woke ? 0x81 : 0x18);
        HAL_Delay(200);
        woke = false;
        leds_write(0);
        HAL_SuspendTick();
        HAL_PWR_EnterSLEEPMode(PWR_MAINREGULATOR_ON, PWR_SLEEPENTRY_WFI);
        HAL_ResumeTick();`,
  }),
  'timer-separator': program({
    globals: `static volatile uint8_t timer_bits;`,
    callbacks: `void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *timer) {
    if (timer->Instance == TIM2) timer_bits ^= 0x01;
    if (timer->Instance == TIM3) timer_bits ^= 0x02;
    if (timer->Instance == TIM4) timer_bits ^= 0x04;
}`,
    setup: `    timer_base_init(&htim2, TIM2, 2);
    timer_base_init(&htim3, TIM3, 4);
    timer_base_init(&htim4, TIM4, 8);
    HAL_TIM_Base_Start_IT(&htim2);
    HAL_TIM_Base_Start_IT(&htim3);
    HAL_TIM_Base_Start_IT(&htim4);`,
    loop: `        leds_write(timer_bits);
        __WFI();`,
  }),
  'ssd-clocks': program({
    globals: `static volatile uint8_t seconds;
static volatile uint8_t minutes;
static volatile uint8_t hundredths;`,
    callbacks: `void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *timer) {
    if (timer->Instance == TIM2 && ++hundredths == 100) {
        hundredths = 0;
        if (++seconds == 60) { seconds = 0; if (++minutes == 60) minutes = 0; }
    }
}`,
    setup: `    timer_base_init(&htim2, TIM2, 100);
    HAL_TIM_Base_Start_IT(&htim2);`,
    loop: `        __disable_irq();
        uint8_t local_minutes = minutes;
        uint8_t local_seconds = seconds;
        __enable_irq();
        uint8_t digits[4] = {
            (uint8_t)(local_minutes / 10), (uint8_t)(local_minutes % 10),
            (uint8_t)(local_seconds / 10), (uint8_t)(local_seconds % 10)
        };
        ssd_scan_digits(digits, (local_seconds & 1u) ? 0x02 : 0);`,
  }),
  'message-marquee': program({
    globals: `static const uint8_t message_segments[] = {0x76,0x79,0x38,0x38,0x3F,0x00};`,
    setup: `    uint8_t origin = 0;
    bool right = true;
    uint32_t interval = 350;
    uint32_t next_scroll = HAL_GetTick() + interval;`,
    loop: `        uint8_t key = key_event();
        if (key == 0) right = !right;
        if (key == 1) interval = interval == 350 ? 150 : interval == 150 ? 700 : 350;
        uint8_t shown[4];
        for (uint8_t index = 0; index < 4; ++index)
            shown[index] = message_segments[(origin + index) % 6u];
        ssd_scan_raw(shown);
        if ((int32_t)(HAL_GetTick() - next_scroll) >= 0) {
            next_scroll += interval;
            origin = right ? (uint8_t)((origin + 5u) % 6u) : (uint8_t)((origin + 1u) % 6u);
        }`,
  }),
  'password-access': program({
    globals: `static const uint8_t password[8] = {0,1,2,3,3,2,1,0};`,
    setup: `    lcd_init();
    uint8_t entered[8];
    uint8_t length = 0;
    uint8_t failures = 0;
    lcd_text("Enter 8 keys");`,
    loop: `        uint8_t key = key_event();
        if (key == 0xFF) continue;
        entered[length++] = key;
        lcd_command((uint8_t)(0xC0 + length - 1u));
        lcd_data('*');
        if (length == 8) {
            uint8_t difference = 0;
            for (uint8_t index = 0; index < 8; ++index) difference |= entered[index] ^ password[index];
            lcd_command(0x01);
            if (difference == 0) { lcd_text("ACCESS GRANTED"); failures = 0; }
            else { lcd_text("ACCESS DENIED"); if (++failures >= 3) { HAL_Delay(5000); failures = 0; } }
            HAL_Delay(1500);
            lcd_command(0x01);
            lcd_text("Enter 8 keys");
            length = 0;
        }`,
  }),
  'brightness-control': program({
    setup: `    adc_init();
    pwm_init();
    uint32_t next_sample = 0;`,
    loop: `        uint8_t key = key_event();
        uint32_t compare = __HAL_TIM_GET_COMPARE(&htim3, TIM_CHANNEL_1);
        if (key == 0 && compare <= 899) compare += 100;
        if (key == 1 && compare >= 100) compare -= 100;
        if (HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_14) == GPIO_PIN_RESET &&
            (int32_t)(HAL_GetTick() - next_sample) >= 0) {
            next_sample = HAL_GetTick() + 20;
            compare = ((uint32_t)adc_read() * 999u) / 4095u;
        }
        __HAL_TIM_SET_COMPARE(&htim3, TIM_CHANNEL_1, compare);`,
  }),
  'timer-counters': program({
    setup: `    uint16_t value = 9;
    uint16_t limit = 9;
    uint32_t period = 1000;
    uint32_t next_tick = HAL_GetTick() + period;
    bool down = true;`,
    loop: `        uint8_t key = key_event();
        if (key == 0) down = !down;
        if (key == 1) { limit = (uint16_t)((limit + 10u) % 10000u); value = limit; }
        if (key == 2) { period = period == 1000 ? 500 : period == 500 ? 2000 : 1000; next_tick = HAL_GetTick() + period; }
        if (key == 3) value = limit;
        uint8_t digits[4];
        digits_from_u16(value, digits);
        ssd_scan_digits(digits, 0);
        if ((int32_t)(HAL_GetTick() - next_tick) >= 0) {
            next_tick += period;
            value = down ? (value == 0 ? limit : (uint16_t)(value - 1u))
                         : (value >= limit ? 0 : (uint16_t)(value + 1u));
        }`,
  }),
  'temperature-displays': program({
    setup: `    adc_init();
    lcd_init();
    uint16_t celsius = 0;
    uint32_t next_sample = 0;`,
    loop: `        if ((int32_t)(HAL_GetTick() - next_sample) >= 0) {
            next_sample += 250;
            uint32_t millivolts = ((uint32_t)adc_read() * 3300u + 2047u) / 4095u;
            celsius = (uint16_t)(millivolts / 10u);
            char line[17];
            snprintf(line, sizeof(line), "Temp %3u C", celsius);
            lcd_command(0x80);
            lcd_text(line);
        }
        uint8_t digits[4];
        digits_from_u16(celsius, digits);
        ssd_scan_digits(digits, 0);`,
  }),
  'stopwatch': program({
    globals: `static volatile uint16_t centiseconds;
static volatile bool running;`,
    callbacks: `void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *timer) {
    if (timer->Instance == TIM2 && running && centiseconds < 5999) ++centiseconds;
}`,
    setup: `    timer_base_init(&htim2, TIM2, 100);
    HAL_TIM_Base_Start_IT(&htim2);
    uint16_t laps[5] = {0};
    uint8_t lap_count = 0;
    uint8_t viewed_lap = 0;`,
    loop: `        uint8_t key = key_event();
        if (key == 0) running = !running;
        if (key == 1 && lap_count < 5) laps[lap_count++] = centiseconds;
        if (key == 2 && lap_count > 0) viewed_lap = (uint8_t)((viewed_lap + 1u) % lap_count);
        if (key == 3) { running = false; centiseconds = 0; lap_count = 0; }
        uint16_t shown = (!running && lap_count > 0) ? laps[viewed_lap] : centiseconds;
        uint8_t digits[4] = {
            (uint8_t)(shown / 6000u), (uint8_t)((shown / 600u) % 10u),
            (uint8_t)((shown / 100u) % 6u), (uint8_t)((shown / 10u) % 10u)
        };
        ssd_scan_digits(digits, 0x02);`,
  }),
  'self-counter-storage': program({
    setup: `    uint16_t count = 0;
    flash_load(&count);
    uint32_t next_tick = HAL_GetTick() + 1000;`,
    loop: `        uint8_t key = key_event();
        if (key == 0) flash_save(count);
        if (key == 1) count = 0;
        if ((int32_t)(HAL_GetTick() - next_tick) >= 0) {
            next_tick += 1000;
            count = (uint16_t)((count + 1u) % 10000u);
        }
        uint8_t digits[4];
        digits_from_u16(count, digits);
        ssd_scan_digits(digits, 0);`,
  }),
  'external-eeprom-counter': program({
    setup: `    i2c_init();
    uint16_t count = ((uint16_t)eeprom24_read(0) << 8) | eeprom24_read(1);
    uint8_t check = eeprom24_read(2);
    if (check != (uint8_t)(count ^ (count >> 8) ^ 0xA6)) count = 0;`,
    loop: `        uint8_t key = key_event();
        if (key == 0) count = (uint16_t)((count + 1u) % 10000u);
        if (key == 1) count = 0;
        if (key == 2) {
            eeprom24_write(0, (uint8_t)(count >> 8));
            eeprom24_write(1, (uint8_t)count);
            eeprom24_write(2, (uint8_t)(count ^ (count >> 8) ^ 0xA6));
        }
        uint8_t digits[4];
        digits_from_u16(count, digits);
        ssd_scan_digits(digits, 0);`,
  }),
  'uart-key-feedback': program({
    setup: `    uart_init();
    uart_text("Key monitor ready\\r\\n");`,
    loop: `        uint8_t key = key_event();
        if (key != 0xFF) {
            char line[] = "SW1 pressed\\r\\n";
            line[2] = (char)('1' + key);
            uart_text(line);
        }`,
  }),
  'uart-clcd-message': program({
    setup: `    uart_init();
    lcd_init();
    char line[17];
    uint8_t length = 0;
    uart_text("Type a line and press Enter\\r\\n");`,
    loop: `        char value = uart_get();
        if (value == '\\r' || value == '\\n') {
            line[length] = '\\0';
            lcd_command(0x01);
            lcd_text(line);
            uart_text("\\r\\n");
            length = 0;
        } else if ((value == '\\b' || value == 127) && length > 0) {
            --length;
            uart_text("\\b \\b");
        } else if (value >= 32 && value <= 126 && length < 16) {
            line[length++] = value;
            char echo[2] = {value, '\\0'};
            uart_text(echo);
        }`,
  }),
};
