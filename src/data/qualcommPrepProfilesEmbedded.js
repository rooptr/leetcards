const concept = (term, definition, example) => ({ term, definition, example });

export const qualcommPrepProfilesEmbedded = {
  'qualcomm-arch-isa-cpu': {
    definition: 'An instruction-set architecture (ISA) is the programmer-visible contract of a processor: instructions, registers, data types, addressing, privilege rules, and memory behavior. A microarchitecture is the particular pipeline, cache, execution-unit, and predictor design that implements that contract.',
    application: 'The same ARM ISA can appear in a small Cortex-M microcontroller and a deeply pipelined application processor, while C and C++ can target either through the compiler.',
    prediction: 'If two processors execute the same ARM instruction set, must they have the same pipeline depth, cache size, interrupt latency, or power use?',
    explanation: 'Start at the contract boundary. Source code is translated into ISA instructions; the processor implementation decides how those instructions flow through fetch, decode, execute, memory, and retirement. “RISC versus CISC” is useful history, but modern ARM and x86 cores both decode, pipeline, cache, speculate, and often execute internal micro-operations.',
    concepts: [
      concept('ISA', 'The software-visible machine contract, including registers, instructions, encodings, addressing modes, exceptions, and privilege levels.', 'ARMv7E-M defines the instruction and exception model used by the Cortex-M4 in STM32F446RE.'),
      concept('Microarchitecture', 'The internal organization used to implement an ISA.', 'A pipeline can overlap fetch of one instruction with execution of another without changing the ISA result.'),
      concept('Register', 'A small named storage location directly operated on by instructions.', 'A function may keep loop state in core registers and spill it to the stack when registers are exhausted.'),
      concept('Instruction cycle', 'A teaching model of fetch, decode, execute, memory access, and result update; real cores overlap or split these stages.', 'A load instruction computes an address, accesses memory or cache, then makes the value available.'),
      concept('RISC and CISC', 'Historical design approaches emphasizing simpler regular instructions or richer variable instructions; they are not complete performance labels.', 'ARM commonly has fixed-width encodings plus Thumb variants; x86 exposes variable-length instructions but modern cores translate many into internal operations.'),
      concept('ARM and x86', 'ISA families with different encodings, register models, privilege architecture, and ecosystems.', 'A compiler can translate the same C loop into ARM or x86 machine code.'),
      concept('CPU family versus use class', 'Processors are better classified by constraints—microcontroller, application, real-time, server, DSP, GPU—than by one vague list of “CPU types”.', 'A Cortex-M4 prioritizes deterministic control and integrated peripherals; a server CPU prioritizes throughput and large memory systems.'),
      concept('Compiler view', 'C and C++ abstractions become instructions under an ABI and optimization model; neither language inherently maps one-to-one to assembly.', 'Inspect generated assembly to see whether a virtual call, bounds check, or copy remains.'),
    ],
    steps: [
      'Name the ISA contract before discussing implementation details.',
      'Trace one instruction from architectural intent through a possible pipeline.',
      'Separate latency, throughput, code density, power, and determinism.',
      'Compare ARM and x86 using exact features instead of “simple versus complex”.',
      'Compile a small C and C++ function for two targets and inspect the generated instructions.',
    ],
    failure: 'Saying “RISC always uses one cycle” or “CISC is slower” is false on modern machines. Instruction count, cycles per instruction, clock rate, memory stalls, and parallel execution all matter.',
    practice: 'Explain why STM32F446RE can execute ARM instructions without sharing the caches, operating system, or power profile of a phone SoC.',
    sourcePrompts: [
      'Explain how a CPU works.',
      'Explain registers and the instruction cycle.',
      'Compare RISC and CISC.',
      'Compare ARM and x86.',
      'Name useful processor classes without confusing class, ISA, and implementation.',
    ],
    codeExamples: [{
      heading: 'Compile the same operation from C and C++',
      note: 'Both functions express the same machine-level work. Inspect optimized assembly rather than assuming one language is automatically faster.',
      c: `#include <stddef.h>

int sum_samples(const int *samples, size_t count)
{
    int total = 0;
    for (size_t i = 0; i < count; ++i)
        total += samples[i];
    return total;
}`,
      cpp: `#include <numeric>
#include <span>

int sum_samples(std::span<const int> samples)
{
    return std::accumulate(samples.begin(), samples.end(), 0);
}`,
    }],
  },

  'qualcomm-arch-memory-digital': {
    definition: 'A computer memory system is a hierarchy of storage structures with different capacity, latency, bandwidth, persistence, and sharing rules; digital state elements such as latches and flip-flops are the physical building blocks from which registers and control state are made.',
    application: 'A camera pipeline can be compute-fast but still miss deadlines because cache misses, DRAM bandwidth, or device transfers starve the CPU or GPU.',
    prediction: 'When a loop becomes ten times slower after its working set grows, how would you distinguish instruction cost from cache capacity, memory bandwidth, paging, and device I/O?',
    explanation: 'Follow the data. Registers feed execution units; caches keep recently used lines; an interconnect and memory controller reach DRAM; the MMU translates addresses; storage and devices move data through controllers, often with DMA. A GPU is another processor optimized for many parallel lanes, not “extra RAM”.',
    concepts: [
      concept('Memory hierarchy', 'Registers, caches, main memory, and storage trade speed, capacity, cost, and persistence.', 'A hot counter may remain in a register while a large image tile repeatedly enters cache from DRAM.'),
      concept('Cache line and locality', 'Caches move fixed-size lines and benefit from temporal reuse and nearby sequential access.', 'Row-major traversal of a C matrix usually uses cache lines better than column-major traversal.'),
      concept('CPU–RAM path', 'Loads and stores use virtual addresses, caches, coherence logic, an interconnect, the MMU/TLB, and a memory controller before DRAM is reached.', 'A cache hit can complete without a DRAM transaction.'),
      concept('GPU', 'A processor organized for high-throughput parallel work, with its own execution and memory hierarchy.', 'Convolution can map many output pixels to parallel GPU work items.'),
      concept('Latch', 'A level-sensitive storage element whose output may follow input while an enable level is active.', 'A transparent latch can pass changes throughout the enabled interval.'),
      concept('Flip-flop', 'An edge-triggered storage element that samples input at a clock edge.', 'A D flip-flop stores one bit of pipeline state per active clock edge.'),
      concept('Measurement', 'Performance claims require a workload, build settings, warm-up policy, clock source, and repeated measurements.', 'Use a monotonic clock and report median and tail latency, not one stopwatch reading.'),
      concept('Bottleneck', 'The resource currently limiting end-to-end throughput or latency.', 'Optimizing arithmetic does not help a loop already saturated on DRAM bandwidth.'),
    ],
    steps: [
      'Draw the path taken by one requested datum.',
      'Estimate working-set size and access order.',
      'Measure elapsed time and hardware counters where available.',
      'Change one variable, such as traversal order or tile size.',
      'Explain the result in terms of latency, bandwidth, or locality.',
    ],
    failure: '“RAM talks directly to the CPU” hides the caches, MMU, interconnect, and controller that determine behavior. A benchmark without optimization flags and repeated runs is not evidence.',
    practice: 'Benchmark row-major and column-major traversal of a large matrix. Predict cache-line use before running, then explain the measured difference.',
    sourcePrompts: [
      'Explain the memory hierarchy and how RAM communicates with the CPU.',
      'Explain cache behavior and performance.',
      'Explain what a GPU is.',
      'Compare latches and flip-flops.',
      'Measure the performance of a program.',
    ],
    codeExamples: [{
      heading: 'Expose locality through traversal order',
      c: `#include <stddef.h>

long sum_rows(const int *matrix, size_t rows, size_t columns)
{
    long sum = 0;
    for (size_t row = 0; row < rows; ++row)
        for (size_t column = 0; column < columns; ++column)
            sum += matrix[row * columns + column];
    return sum;
}`,
      cpp: `#include <cstddef>
#include <span>

long sum_rows(std::span<const int> matrix, std::size_t columns)
{
    long sum = 0;
    for (std::size_t row = 0; row < matrix.size() / columns; ++row)
        for (std::size_t column = 0; column < columns; ++column)
            sum += matrix[row * columns + column];
    return sum;
}`,
    }],
  },

  'qualcomm-embedded-rtos-interrupts': {
    definition: 'An interrupt is an event that temporarily redirects execution to a handler; an RTOS is an operating system designed to schedule tasks and manage synchronization with bounded, analyzable timing behavior.',
    application: 'A motor controller may timestamp an encoder edge in an ISR, wake a high-priority control task, and guarantee that the control output is updated before a deadline.',
    prediction: 'Why should an ISR capture the event and defer slow parsing, allocation, logging, or blocking I/O to normal task context?',
    explanation: 'Real-time means deadlines are predictable, not merely “fast”. Interrupt latency includes hardware entry, masking, higher-priority work, and software prologue. ISR execution adds blocking time for lower-priority interrupts and tasks. Keep the handler short, communicate through a bounded mechanism, and measure worst cases.',
    concepts: [
      concept('Embedded system', 'A computer integrated into a larger product to perform constrained sensing, control, communication, or user-interface work.', 'A vehicle ECU reads sensors and controls actuators under timing and safety constraints.'),
      concept('General-purpose OS', 'An OS optimized for broad workloads, fairness, throughput, isolation, and rich services rather than strict worst-case timing.', 'Desktop Linux provides powerful process isolation but default scheduling is not a hard real-time guarantee.'),
      concept('RTOS', 'A scheduler and kernel service set designed around bounded timing and task priorities.', 'FreeRTOS can block a task on a queue and immediately run a newly readied higher-priority task.'),
      concept('Interrupt', 'A hardware or software event that changes control flow through an exception vector.', 'A UART receive event can invoke a handler when a byte arrives.'),
      concept('ISR', 'The routine executed in interrupt context, under restrictions imposed by the architecture and kernel.', 'An ISR clears the source, captures data, and wakes a task.'),
      concept('Latency', 'The time from an event becoming eligible to the first relevant handler instruction.', 'Disabled interrupts and higher-priority handlers increase latency.'),
      concept('Preemption', 'Suspending lower-priority execution so higher-priority work can run.', 'A control task can preempt a logging task when new sensor data arrives.'),
      concept('Priority inversion', 'A high-priority task waits for a resource held by a lower-priority task while medium-priority work delays release.', 'A mutex with priority inheritance can bound this delay.'),
    ],
    steps: [
      'State the event source and deadline.',
      'Assign the minimum ISR responsibility.',
      'Choose a bounded handoff: flag, queue, semaphore, or DMA completion.',
      'Analyze masking, nesting, scheduler, and critical-section delays.',
      'Measure worst-case latency on hardware with a GPIO pulse or trace facility.',
    ],
    failure: 'Printing, sleeping, allocating, or taking an ordinary blocking mutex inside an ISR can deadlock or destroy timing. High priority alone does not prove a deadline.',
    practice: 'Design the interrupt-to-task path for UART receive on STM32F446RE and identify exactly where bytes can be lost.',
    sourcePrompts: [
      'Differentiate embedded, real-time, and general-purpose systems.',
      'Explain RTOS concepts and preemption.',
      'Explain interrupts, ISR types, and interrupt latency.',
      'Explain what may and may not run in an ISR.',
    ],
    codeExamples: [{
      heading: 'Capture in the ISR, consume in normal context',
      note: 'The example shows the ownership rule; a production ring buffer also needs an explicit overflow policy and architecture-appropriate atomic ordering.',
      c: `#include <stdbool.h>
#include <stdint.h>

static volatile uint8_t received_byte;
static volatile bool byte_ready;

void uart_rx_isr(uint8_t hardware_byte)
{
    received_byte = hardware_byte;
    byte_ready = true;
}

bool uart_try_read(uint8_t *out)
{
    if (!byte_ready)
        return false;
    *out = received_byte;
    byte_ready = false;
    return true;
}`,
      cpp: `#include <atomic>
#include <cstdint>
#include <optional>

class IsrMailbox {
public:
    void publish_from_isr(std::uint8_t value) noexcept {
        value_.store(value, std::memory_order_relaxed);
        ready_.store(true, std::memory_order_release);
    }

    std::optional<std::uint8_t> try_take() noexcept {
        if (!ready_.exchange(false, std::memory_order_acquire))
            return std::nullopt;
        return value_.load(std::memory_order_relaxed);
    }

private:
    std::atomic<std::uint8_t> value_{};
    std::atomic<bool> ready_{false};
};`,
    }],
  },

  'qualcomm-embedded-uart': {
    definition: 'UART is an asynchronous serial framing method in which two endpoints agree on symbol rate and frame format, then send start, data, optional parity, and stop bits without a shared clock wire.',
    application: 'STM32F446RE uses a USART peripheral for debug logs, command consoles, modules, and board-to-board links; a logic analyzer can decode the voltage transitions into frames.',
    prediction: 'At 115200 baud with 8 data bits, no parity, and one stop bit, how long does one ten-bit frame take and what sustained byte rate is theoretically possible?',
    explanation: 'Idle is normally high. A falling start bit establishes phase; the receiver samples data bits at the configured baud timing and validates the stop bit. “No clock pulses” does not mean no timing: both UARTs must derive close-enough baud clocks internally. A separate clock wire describes a synchronous mode, not ordinary UART.',
    concepts: [
      concept('Baud', 'Symbols transmitted per second; for ordinary binary UART, one symbol carries one bit.', '115200 baud gives about 8.68 microseconds per bit.'),
      concept('Frame', 'The start, data, parity, and stop-bit sequence used to carry one word.', '8-N-1 consumes ten bits per eight-bit byte.'),
      concept('Start bit', 'A transition from idle high to low that lets the receiver align sampling.', 'The receiver samples near each bit center after detecting the edge.'),
      concept('Parity', 'An optional single-bit error-detection scheme, not error correction.', 'Even parity makes the total number of one bits even.'),
      concept('Framing error', 'A receiver result when the expected stop-bit level is not observed.', 'Baud mismatch or noise can make the stop sample low.'),
      concept('TX/RX wiring', 'Each transmitter connects to the other endpoint’s receiver and both share a compatible ground/reference.', 'Board TX connects to adapter RX, not TX.'),
      concept('USART registers', 'Configuration, status, baud-rate, transmit, and receive registers control the peripheral.', 'STM32 exposes status and data paths plus baud and control configuration.'),
      concept('Polling, interrupt, DMA', 'Three ways software services the data path, trading simplicity, CPU load, buffering, and latency.', 'DMA is useful for sustained blocks; interrupts suit moderate asynchronous traffic.'),
    ],
    steps: [
      'Confirm voltage levels, ground, pin mapping, and alternate function.',
      'Choose baud, word length, parity, and stop bits on both endpoints.',
      'Compute frame time and buffering needs.',
      'Configure clocks and the peripheral, then choose polling, interrupt, or DMA.',
      'Capture the wire and verify idle, bit period, frame order, and errors.',
    ],
    failure: 'Connecting RS-232 voltage levels directly to MCU pins can damage hardware. Matching the text “115200” is insufficient if the peripheral clock or baud divisor is wrong.',
    practice: 'For 115200 8-N-1, calculate the bit time, frame time, and ideal bytes per second. Then identify them on a logic-analyzer trace.',
    sourcePrompts: [
      'Explain UART and its registers.',
      'Explain baud rate and UART timing.',
      'Explain how data moves without a shared clock.',
      'Implement and debug UART on STM32F446RE.',
    ],
    codeExamples: [{
      heading: 'Describe and validate a UART format',
      c: `#include <stdbool.h>
#include <stdint.h>

struct uart_format {
    uint32_t baud;
    uint8_t data_bits;
    uint8_t parity_bits;
    uint8_t stop_bits;
};

uint32_t uart_frames_per_second(struct uart_format format)
{
    uint32_t bits = 1u + format.data_bits +
                    format.parity_bits + format.stop_bits;
    return bits == 0u ? 0u : format.baud / bits;
}

bool uart_format_valid(struct uart_format format)
{
    return format.baud != 0u &&
           (format.data_bits == 8u || format.data_bits == 9u) &&
           format.parity_bits <= 1u &&
           (format.stop_bits == 1u || format.stop_bits == 2u);
}`,
      cpp: `#include <cstdint>
#include <stdexcept>

class UartFormat {
public:
    constexpr UartFormat(std::uint32_t baud, unsigned data_bits,
                         unsigned parity_bits, unsigned stop_bits)
        : baud_{baud}, frame_bits_{1u + data_bits + parity_bits + stop_bits}
    {
        if (baud == 0 || (data_bits != 8 && data_bits != 9) ||
            parity_bits > 1 || (stop_bits != 1 && stop_bits != 2))
            throw std::invalid_argument{"invalid UART format"};
    }

    [[nodiscard]] constexpr std::uint32_t frames_per_second() const {
        return baud_ / frame_bits_;
    }

private:
    std::uint32_t baud_;
    unsigned frame_bits_;
};`,
    }],
  },

  'qualcomm-embedded-buses': {
    definition: 'SPI, I2C, and CAN are distinct serial communication systems: SPI clocks full-duplex shift transfers with explicit selection, I2C shares open-drain clock/data lines using addressed transactions, and CAN uses differential signaling plus arbitration for robust multi-node messages.',
    application: 'A board may configure a camera sensor over I2C, stream data over a separate parallel or high-speed link, read flash over SPI, and exchange vehicle state over CAN.',
    prediction: 'Why can I2C devices safely pull SDA low together during arbitration, while ordinary push-pull outputs tied together could short the rail?',
    explanation: 'Reason from the wires first. SPI usually has SCLK, MOSI, MISO, and one chip-select per selected slave. I2C devices only pull lines low and depend on pull-ups for high, enabling ACK and arbitration. CAN transceivers drive a differential dominant/recessive bus and controllers arbitrate by identifier without destroying the winning frame.',
    concepts: [
      concept('SPI transaction', 'A controller selects a device and clocks bits through shift registers; transmission and reception occur together.', 'Reading a register often sends a command byte while simultaneously receiving a discard byte.'),
      concept('SPI slave count', 'The practical number is limited by chip-select GPIOs or decoding, electrical loading, timing, protocol behavior, and board design—not one universal number.', 'A decoder can expand chip selects, but trace capacitance and firmware still constrain the bus.'),
      concept('I2C transaction', 'A START, address plus direction, ACK/NACK phases, data bytes, and STOP or repeated START sequence.', 'A register read often writes a register address, issues repeated START, then reads data.'),
      concept('Open-drain', 'Devices actively pull low but release the line for high, which the pull-up resistor creates.', 'ACK is produced by the receiver pulling SDA low during the ninth clock.'),
      concept('Wired-AND behavior', 'The bus is high only when every participant releases it; any low dominates.', 'Two masters detect arbitration loss when one releases a one but observes zero.'),
      concept('CAN', 'A message-oriented differential bus with identifier-based arbitration and strong error handling.', 'Lower numeric identifiers win bitwise arbitration because dominant bits override recessive bits.'),
      concept('Camera control path', 'I2C commonly configures sensor registers; pixel payload usually uses a separate parallel, MIPI, USB, or other high-bandwidth path.', 'Changing exposure over I2C does not mean image frames travel over I2C.'),
      concept('Physical layer', 'Logic protocol, voltage, pull-ups, termination, level translation, and grounding must all agree.', 'CAN needs a transceiver and correctly placed termination; MCU logic pins alone are not the bus.'),
    ],
    steps: [
      'Identify every wire, driver type, voltage domain, and termination or pull-up.',
      'Write the exact transaction as ordered phases.',
      'Calculate clock and rise-time constraints.',
      'Map protocol events to peripheral status flags.',
      'Capture and decode a real transaction, including failure responses.',
    ],
    failure: 'Treating a protocol name as only a software API misses most hardware faults. Missing I2C pull-ups, incorrect SPI mode, absent CAN termination, or wrong voltage domains cannot be fixed by retry loops.',
    practice: 'Draw one SPI register read and one I2C repeated-START register read, showing who drives each line at every phase.',
    sourcePrompts: [
      'Explain SPI and how many slaves it can support.',
      'Explain I2C, open-drain output, pull-ups, and wired-AND behavior.',
      'Explain CAN.',
      'Explain how a camera can use I2C.',
      'Compare UART, SPI, I2C, and CAN.',
    ],
    codeExamples: [{
      heading: 'Represent a register transaction independently of the MCU vendor',
      c: `#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

struct i2c_bus {
    bool (*write_read)(uint8_t address,
                       const uint8_t *write_data, size_t write_size,
                       uint8_t *read_data, size_t read_size);
};

bool read_register(struct i2c_bus bus, uint8_t device,
                   uint8_t reg, uint8_t *value)
{
    return bus.write_read(device, &reg, 1u, value, 1u);
}`,
      cpp: `#include <cstdint>
#include <span>

class I2cBus {
public:
    virtual ~I2cBus() = default;
    virtual bool write_read(std::uint8_t address,
                            std::span<const std::uint8_t> tx,
                            std::span<std::uint8_t> rx) = 0;
};

bool read_register(I2cBus& bus, std::uint8_t device,
                   std::uint8_t reg, std::uint8_t& value)
{
    return bus.write_read(device, std::span{&reg, 1},
                          std::span{&value, 1});
}`,
    }],
  },

  'qualcomm-embedded-mcu-memory': {
    definition: 'A microcontroller combines a processor core, nonvolatile program memory, RAM, clock/reset logic, interrupt control, and memory-mapped peripherals in one device; special-function registers are addresses through which software observes and controls that hardware.',
    application: 'Writing a GPIO output register changes a physical pin because the address is decoded by the peripheral bus, not because the address contains ordinary RAM.',
    prediction: 'Why must a peripheral register pointer be volatile, and why does volatile still not make a read-modify-write sequence atomic?',
    explanation: 'The downloaded notes use 8051 language such as SFRs and separate memory spaces. Learn that model, then transfer the principle to STM32F446RE: consult its reference manual and memory map, enable the peripheral clock, configure GPIO mode and alternate function, and access registers through vendor definitions or a verified hardware abstraction.',
    concepts: [
      concept('Microcontroller', 'An integrated computer designed for control-oriented applications with on-chip peripherals and memory.', 'STM32F446RE combines a Cortex-M4 core with flash, SRAM, timers, ADC, communication peripherals, and interrupt control.'),
      concept('SFR or peripheral register', 'A hardware control/status location mapped into an architecture-defined address space.', 'A timer status bit records an update event and may require a documented clear sequence.'),
      concept('Memory map', 'The assignment of address ranges to flash, SRAM, peripherals, external devices, and system control blocks.', 'Dereferencing an address in the GPIO range reaches peripheral logic.'),
      concept('Program and data memory', 'Architectures may expose unified or distinct address spaces and buses, with device-specific access rules.', 'Classic 8051 distinguishes several code/data spaces; Cortex-M uses one architectural address map with implementation regions.'),
      concept('GPIO', 'Configurable digital pins with modes, output type, speed, pulls, input state, output state, and alternate-function routing.', 'A pin must be placed in alternate-function mode before USART can drive it.'),
      concept('volatile', 'A C/C++ qualifier requiring observable accesses to occur as specified by the abstract machine; it is used for device registers and asynchronously changed objects.', 'A status register must be re-read instead of cached in a compiler-generated register.'),
      concept('Read-modify-write hazard', 'A sequence that reads a register, changes bits, and writes it back can lose concurrent hardware or interrupt updates.', 'Use dedicated set/reset registers when the device provides them.'),
      concept('Portability layer', 'Separating intent from vendor access code makes a driver transferable while preserving target-specific timing and register rules.', 'A generic LED interface can have STM32 HAL and direct-register backends.'),
    ],
    steps: [
      'Find the component datasheet, reference manual, and board schematic.',
      'Locate the peripheral address, clock gate, reset, pins, and interrupt.',
      'Read every field access rule, reset value, and side effect.',
      'Configure in dependency order: clock, pin, peripheral, interrupt or DMA.',
      'Verify the physical pin and register state with debugger and instruments.',
    ],
    failure: 'Copying an 8051 register name into an STM32 design teaches syntax, not architecture. Likewise, volatile is not a lock, memory barrier, cache policy, or atomicity guarantee.',
    practice: 'Map an 8051-style “set port bit” exercise to STM32F446RE and list the clock, MODER, output register, board pin, and schematic checks required.',
    sourcePrompts: [
      'Explain microcontroller architecture and memory types.',
      'Explain 8051 SFRs and GPIO.',
      'Transfer the same concepts to STM32F446RE.',
      'Explain memory-mapped registers and volatile.',
    ],
    codeExamples: [{
      heading: 'Use explicit volatile register access',
      note: 'Addresses and bit definitions are illustrative; use the exact STM32F446RE device header and reference manual in firmware.',
      c: `#include <stdint.h>

static inline void register_set_bits(volatile uint32_t *reg,
                                     uint32_t mask)
{
    *reg = *reg | mask;
}

static inline void register_clear_bits(volatile uint32_t *reg,
                                       uint32_t mask)
{
    *reg = *reg & ~mask;
}`,
      cpp: `#include <cstdint>

class Register32 {
public:
    explicit Register32(std::uintptr_t address)
        : value_{reinterpret_cast<volatile std::uint32_t*>(address)} {}

    void set(std::uint32_t mask) const { *value_ |= mask; }
    void clear(std::uint32_t mask) const { *value_ &= ~mask; }
    [[nodiscard]] std::uint32_t read() const { return *value_; }

private:
    volatile std::uint32_t* value_;
};`,
    }],
  },

  'qualcomm-embedded-feedback': {
    definition: 'A sensor signal path converts a physical quantity into samples, rejects or models noise, decides what change is meaningful, and feeds a display or controller; filtering smooths measurements, hysteresis prevents threshold chatter, and feedback changes an actuator based on measured error.',
    application: 'A temperature controller filters ADC samples, applies separate on/off thresholds, and adjusts a heater while retaining raw data for diagnostics.',
    prediction: 'If a noisy reading oscillates around 30 °C, why does one threshold make an output chatter, and how do two thresholds change the state transitions?',
    explanation: 'Do not use “stabilization” as one vague trick. First decide whether the problem is electrical noise, ADC quantization, sampling aliasing, a bouncing switch, a bad reference, or an unstable control loop. Then choose hardware conditioning, averaging, median filtering, debouncing, hysteresis, calibration, or a closed-loop controller for that failure.',
    concepts: [
      concept('Sampling', 'Measuring a continuous signal at discrete times with a defined rate and acquisition behavior.', 'An ADC periodically samples a potentiometer voltage.'),
      concept('Calibration', 'Mapping raw readings to physical values while correcting offset, gain, and sometimes nonlinearity.', 'Two known temperatures can estimate a linear sensor offset and slope.'),
      concept('Low-pass filtering', 'Reducing rapid variation so slower signal behavior is easier to observe.', 'An exponential moving average requires little memory on an MCU.'),
      concept('Median filter', 'Choosing the middle of a small sample window to reject isolated spikes.', 'A three-sample median can remove a single impulsive outlier.'),
      concept('Hysteresis', 'Using different thresholds for entering and leaving a state.', 'Turn the fan on above 31 °C and off below 29 °C.'),
      concept('Debounce', 'Rejecting repeated transitions caused by mechanical contact bounce.', 'Require a switch state to remain stable for a time before accepting it.'),
      concept('Feedback', 'Measuring the output of a system and changing the input according to the error from a target.', 'A PID loop adjusts PWM duty to regulate speed.'),
      concept('Observability', 'Keeping raw, filtered, state, and output values visible enough to diagnose the system.', 'Log ADC code, calibrated units, threshold state, and actuator command separately.'),
    ],
    steps: [
      'Define the physical quantity and required accuracy, response time, and safety range.',
      'Inspect the schematic, reference, grounding, and analog front end.',
      'Collect raw samples and characterize noise before filtering.',
      'Choose the smallest mechanism that addresses the measured failure.',
      'Validate step response, steady state, boundaries, and sensor faults.',
    ],
    failure: 'A large moving average can hide a symptom while adding dangerous delay. Hysteresis prevents chatter but does not remove measurement error or stabilize an unstable control loop.',
    practice: 'Design a temperature alarm that remains quiet under ±0.4 °C noise, detects a genuine rise promptly, and enters a safe state if the sensor disconnects.',
    sourcePrompts: [
      'Stabilize a noisy sensor reading.',
      'Explain filtering, hysteresis, and feedback.',
      'Explain how to choose the right mechanism rather than applying one analogy.',
    ],
    codeExamples: [{
      heading: 'Filter a sample and apply hysteresis',
      c: `#include <stdbool.h>

struct temperature_monitor {
    float filtered;
    bool alarm;
};

void temperature_update(struct temperature_monitor *monitor,
                        float sample)
{
    const float alpha = 0.2f;
    monitor->filtered += alpha * (sample - monitor->filtered);

    if (!monitor->alarm && monitor->filtered >= 31.0f)
        monitor->alarm = true;
    else if (monitor->alarm && monitor->filtered <= 29.0f)
        monitor->alarm = false;
}`,
      cpp: `class TemperatureMonitor {
public:
    explicit TemperatureMonitor(float initial) : filtered_{initial} {}

    void update(float sample) {
        filtered_ += 0.2F * (sample - filtered_);
        if (!alarm_ && filtered_ >= 31.0F) alarm_ = true;
        else if (alarm_ && filtered_ <= 29.0F) alarm_ = false;
    }

    [[nodiscard]] float filtered() const { return filtered_; }
    [[nodiscard]] bool alarm() const { return alarm_; }

private:
    float filtered_;
    bool alarm_{false};
};`,
    }],
  },

  'qualcomm-embedded-system-design': {
    definition: 'Embedded system design turns a product requirement into measurable interfaces, timing and power budgets, hardware blocks, firmware responsibilities, failure handling, and evidence that the complete system works.',
    application: 'An IoT parking system joins sensing, local decision logic, low-power communication, backend state, user display, security, and field maintenance; no single MCU driver is the whole design.',
    prediction: 'If a parking sensor reports “free” while the network is offline, which component owns truth, how stale may the data be, and what must the user interface show?',
    explanation: 'Walk one real event end to end. A vehicle changes the sensor signal; firmware validates it; local state changes; a message is authenticated and retried; the backend resolves duplicates and freshness; the UI communicates confidence. Then repeat for power loss, sensor failure, packet loss, update failure, and tampering.',
    concepts: [
      concept('Requirement', 'A testable statement of behavior or constraint rather than a feature name.', 'Occupancy changes must appear locally within 500 ms and remotely within 5 s when connected.'),
      concept('Block diagram', 'A view of system components, interfaces, direction, and ownership.', 'Sensor → analog front end → MCU → radio → service → app.'),
      concept('Budget', 'A quantitative allocation of time, power, memory, bandwidth, cost, or error.', 'A battery-energy budget determines sensing and radio duty cycles.'),
      concept('State model', 'An explicit set of states and legal transitions, including faults and recovery.', 'Unknown, free, occupied, sensor-fault, and stale-network states prevent unsafe binary guesses.'),
      concept('Phone hardware', 'A system of application processors, baseband/radio, memory/storage, PMIC, display/touch, sensors, audio, cameras, and secure hardware connected by multiple buses.', 'The application processor does not directly replace every sensor controller or radio subsystem.'),
      concept('Security boundary', 'The point at which identity, authorization, confidentiality, integrity, and update trust must be enforced.', 'A signed firmware update and per-device credentials reduce malicious replacement.'),
      concept('Diagnostics', 'Telemetry and local evidence designed to explain failures in the field.', 'Reset reason, sensor health, message sequence, firmware version, and power history shorten diagnosis.'),
      concept('Verification', 'Evidence that components and integrated behavior satisfy requirements.', 'Hardware-in-the-loop tests inject sensor and communication faults while checking deadlines.'),
    ],
    steps: [
      'Turn the problem statement into measurable functional and nonfunctional requirements.',
      'Draw blocks, physical interfaces, data ownership, and trust boundaries.',
      'Allocate timing, power, memory, bandwidth, and error budgets.',
      'Define normal, startup, degraded, fault, and recovery states.',
      'Plan unit, integration, hardware-in-the-loop, environmental, and field tests.',
    ],
    failure: 'Listing parts is not system design. A credible answer explains why each part exists, what happens when it fails, and how the team will prove the behavior.',
    practice: 'Design the parking system twice: once as a vendor-neutral architecture and once using STM32F446RE as the controller. State what must change and what remains invariant.',
    sourcePrompts: [
      'Design an IoT parking system.',
      'Explain mobile-phone hardware.',
      'Explain the application and background of a project.',
      'Connect requirements, interfaces, failures, security, and testing.',
    ],
    codeExamples: [],
  },
};
