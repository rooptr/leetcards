const lab = (id, title, keywords, covers, source) => ({
  id,
  title,
  keywords,
  covers,
  source: source.trim(),
});

export const collegeDsaLabs = [
  lab(
    'singly-linked-list-toolkit',
    'Singly linked list toolkit',
    ['linked list', 'middle', 'nth last', 'loop', 'reverse', 'merge', 'duplicates'],
    [
      'Single linked list basic operations',
      'Single linked list',
      'Find middle element and get nth last',
      'Insert data in a sorted linked list and detect a loop',
      'Sort a single linked list',
      'Reverse a single linked list iteratively and recursively',
      'Remove duplicates in a single linked list',
      'Merge two linked lists',
    ],
    String.raw`
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

static Node *node_new(int data) {
    Node *node = malloc(sizeof(*node));
    if (node == NULL) {
        perror("malloc");
        exit(EXIT_FAILURE);
    }
    node->data = data;
    node->next = NULL;
    return node;
}

static bool push_front(Node **head, int data) {
    Node *node = node_new(data);
    node->next = *head;
    *head = node;
    return true;
}

static bool push_back(Node **head, int data) {
    Node **link = head;
    while (*link != NULL) link = &(*link)->next;
    *link = node_new(data);
    return true;
}

static bool insert_after(Node *position, int data) {
    if (position == NULL) return false;
    Node *node = node_new(data);
    node->next = position->next;
    position->next = node;
    return true;
}

static bool delete_value(Node **head, int data) {
    Node **link = head;
    while (*link != NULL && (*link)->data != data) link = &(*link)->next;
    if (*link == NULL) return false;
    Node *removed = *link;
    *link = removed->next;
    free(removed);
    return true;
}

static Node *find(Node *head, int data) {
    for (; head != NULL; head = head->next)
        if (head->data == data) return head;
    return NULL;
}

static Node *middle(Node *head) {
    Node *slow = head;
    Node *fast = head;
    while (fast != NULL && fast->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}

static Node *nth_from_end(Node *head, size_t n) {
    if (n == 0) return NULL;
    Node *lead = head;
    for (size_t i = 0; i < n; ++i) {
        if (lead == NULL) return NULL;
        lead = lead->next;
    }
    Node *follow = head;
    while (lead != NULL) {
        lead = lead->next;
        follow = follow->next;
    }
    return follow;
}

static void sorted_insert(Node **head, int data) {
    Node **link = head;
    while (*link != NULL && (*link)->data < data) link = &(*link)->next;
    Node *node = node_new(data);
    node->next = *link;
    *link = node;
}

static Node *cycle_entry(Node *head) {
    Node *slow = head;
    Node *fast = head;
    do {
        if (fast == NULL || fast->next == NULL) return NULL;
        slow = slow->next;
        fast = fast->next->next;
    } while (slow != fast);
    slow = head;
    while (slow != fast) {
        slow = slow->next;
        fast = fast->next;
    }
    return slow;
}

static Node *merge_sorted(Node *left, Node *right) {
    Node sentinel = {0, NULL};
    Node *tail = &sentinel;
    while (left != NULL && right != NULL) {
        Node **smaller = left->data <= right->data ? &left : &right;
        tail->next = *smaller;
        *smaller = (*smaller)->next;
        tail = tail->next;
    }
    tail->next = left != NULL ? left : right;
    return sentinel.next;
}

static Node *merge_sort(Node *head) {
    if (head == NULL || head->next == NULL) return head;
    Node *slow = head;
    Node *fast = head->next;
    while (fast != NULL && fast->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;
    }
    Node *right = slow->next;
    slow->next = NULL;
    return merge_sorted(merge_sort(head), merge_sort(right));
}

static Node *reverse_iterative(Node *head) {
    Node *previous = NULL;
    while (head != NULL) {
        Node *next = head->next;
        head->next = previous;
        previous = head;
        head = next;
    }
    return previous;
}

static Node *reverse_recursive(Node *head) {
    if (head == NULL || head->next == NULL) return head;
    Node *new_head = reverse_recursive(head->next);
    head->next->next = head;
    head->next = NULL;
    return new_head;
}

static void remove_duplicates_sorted(Node *head) {
    while (head != NULL && head->next != NULL) {
        if (head->data == head->next->data) {
            Node *duplicate = head->next;
            head->next = duplicate->next;
            free(duplicate);
        } else {
            head = head->next;
        }
    }
}

static void print_list(const Node *head) {
    for (; head != NULL; head = head->next) printf("%d%s", head->data, head->next ? " -> " : "\n");
}

static void destroy(Node **head) {
    while (*head != NULL) {
        Node *next = (*head)->next;
        free(*head);
        *head = next;
    }
}

int main(void) {
    Node *list = NULL;
    const int values[] = {4, 1, 3, 2, 3, 5};
    for (size_t i = 0; i < sizeof(values) / sizeof(values[0]); ++i) push_back(&list, values[i]);
    push_front(&list, 0);
    insert_after(find(list, 4), 6);
    delete_value(&list, 6);
    list = merge_sort(list);
    remove_duplicates_sorted(list);
    print_list(list);

    Node *mid = middle(list);
    Node *third_last = nth_from_end(list, 3);
    printf("middle=%d third-last=%d cycle=%s\n",
           mid ? mid->data : -1,
           third_last ? third_last->data : -1,
           cycle_entry(list) ? "yes" : "no");

    sorted_insert(&list, 4);
    list = reverse_iterative(list);
    list = reverse_recursive(list);

    Node *other = NULL;
    sorted_insert(&other, 7);
    sorted_insert(&other, 2);
    list = merge_sorted(list, other);
    print_list(list);
    destroy(&list);
    return EXIT_SUCCESS;
}`,
  ),
  lab(
    'doubly-linked-list-toolkit',
    'Doubly linked list toolkit',
    ['doubly linked list', 'insert', 'delete', 'forward', 'reverse'],
    ['Double linked list', 'Double linked list'],
    String.raw`
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *previous;
    struct Node *next;
} Node;

typedef struct {
    Node *head;
    Node *tail;
    size_t size;
} List;

static Node *node_new(int data) {
    Node *node = malloc(sizeof(*node));
    if (node == NULL) {
        perror("malloc");
        exit(EXIT_FAILURE);
    }
    *node = (Node){.data = data, .previous = NULL, .next = NULL};
    return node;
}

static void push_front(List *list, int data) {
    Node *node = node_new(data);
    node->next = list->head;
    if (list->head != NULL) list->head->previous = node;
    else list->tail = node;
    list->head = node;
    ++list->size;
}

static void push_back(List *list, int data) {
    Node *node = node_new(data);
    node->previous = list->tail;
    if (list->tail != NULL) list->tail->next = node;
    else list->head = node;
    list->tail = node;
    ++list->size;
}

static bool insert_after(List *list, Node *position, int data) {
    if (position == NULL) return false;
    Node *node = node_new(data);
    node->previous = position;
    node->next = position->next;
    if (position->next != NULL) position->next->previous = node;
    else list->tail = node;
    position->next = node;
    ++list->size;
    return true;
}

static Node *find(const List *list, int data) {
    for (Node *node = list->head; node != NULL; node = node->next)
        if (node->data == data) return node;
    return NULL;
}

static bool erase(List *list, Node *node) {
    if (node == NULL) return false;
    if (node->previous != NULL) node->previous->next = node->next;
    else list->head = node->next;
    if (node->next != NULL) node->next->previous = node->previous;
    else list->tail = node->previous;
    free(node);
    --list->size;
    return true;
}

static void reverse(List *list) {
    Node *node = list->head;
    while (node != NULL) {
        Node *next = node->next;
        node->next = node->previous;
        node->previous = next;
        node = next;
    }
    Node *temporary = list->head;
    list->head = list->tail;
    list->tail = temporary;
}

static void print_both_directions(const List *list) {
    for (Node *node = list->head; node != NULL; node = node->next) printf("%d ", node->data);
    putchar('\n');
    for (Node *node = list->tail; node != NULL; node = node->previous) printf("%d ", node->data);
    putchar('\n');
}

static void destroy(List *list) {
    while (list->head != NULL) erase(list, list->head);
}

int main(void) {
    List list = {0};
    push_back(&list, 2);
    push_front(&list, 1);
    push_back(&list, 4);
    insert_after(&list, find(&list, 2), 3);
    erase(&list, find(&list, 2));
    print_both_directions(&list);
    reverse(&list);
    print_both_directions(&list);
    destroy(&list);
    return EXIT_SUCCESS;
}`,
  ),
  lab(
    'stack-implementations',
    'Stacks using arrays and linked lists',
    ['stack', 'array stack', 'linked stack', 'LIFO'],
    ['Implement stack using array', 'Implement stack using linked list'],
    String.raw`
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#define STACK_CAPACITY 8

typedef struct {
    int items[STACK_CAPACITY];
    size_t size;
} ArrayStack;

static bool array_push(ArrayStack *stack, int value) {
    if (stack->size == STACK_CAPACITY) return false;
    stack->items[stack->size++] = value;
    return true;
}

static bool array_pop(ArrayStack *stack, int *value) {
    if (stack->size == 0) return false;
    *value = stack->items[--stack->size];
    return true;
}

static bool array_peek(const ArrayStack *stack, int *value) {
    if (stack->size == 0) return false;
    *value = stack->items[stack->size - 1];
    return true;
}

typedef struct Node {
    int value;
    struct Node *next;
} Node;

typedef struct {
    Node *top;
    size_t size;
} LinkedStack;

static bool linked_push(LinkedStack *stack, int value) {
    Node *node = malloc(sizeof(*node));
    if (node == NULL) return false;
    *node = (Node){.value = value, .next = stack->top};
    stack->top = node;
    ++stack->size;
    return true;
}

static bool linked_pop(LinkedStack *stack, int *value) {
    if (stack->top == NULL) return false;
    Node *node = stack->top;
    *value = node->value;
    stack->top = node->next;
    free(node);
    --stack->size;
    return true;
}

static void linked_destroy(LinkedStack *stack) {
    int ignored;
    while (linked_pop(stack, &ignored)) {}
}

int main(void) {
    ArrayStack array = {0};
    LinkedStack linked = {0};
    for (int value = 1; value <= 4; ++value) {
        if (!array_push(&array, value) || !linked_push(&linked, value)) return EXIT_FAILURE;
    }
    int left;
    int right;
    array_peek(&array, &left);
    printf("array top=%d\n", left);
    while (array_pop(&array, &left) && linked_pop(&linked, &right))
        printf("array=%d linked=%d\n", left, right);
    linked_destroy(&linked);
    return EXIT_SUCCESS;
}`,
  ),
  lab(
    'expression-conversion',
    'Infix, postfix, and prefix conversion and evaluation',
    ['infix', 'postfix', 'prefix', 'expression', 'stack'],
    ['Convert infix to postfix and evaluate postfix', 'Convert infix to prefix and evaluate prefix'],
    String.raw`
#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define LIMIT 256

static int precedence(char operator) {
    if (operator == '^') return 3;
    if (operator == '*' || operator == '/' || operator == '%') return 2;
    if (operator == '+' || operator == '-') return 1;
    return 0;
}

static bool right_associative(char operator) {
    return operator == '^';
}

static bool infix_to_postfix(const char *input, char output[LIMIT]) {
    char operators[LIMIT];
    size_t top = 0;
    size_t written = 0;
    for (size_t i = 0; input[i] != '\0';) {
        if (isspace((unsigned char)input[i])) {
            ++i;
        } else if (isdigit((unsigned char)input[i])) {
            while (isdigit((unsigned char)input[i])) output[written++] = input[i++];
            output[written++] = ' ';
        } else if (input[i] == '(') {
            operators[top++] = input[i++];
        } else if (input[i] == ')') {
            while (top > 0 && operators[top - 1] != '(') {
                output[written++] = operators[--top];
                output[written++] = ' ';
            }
            if (top == 0) return false;
            --top;
            ++i;
        } else if (strchr("+-*/%^", input[i]) != NULL) {
            char incoming = input[i++];
            while (top > 0 && operators[top - 1] != '(' &&
                   (precedence(operators[top - 1]) > precedence(incoming) ||
                    (precedence(operators[top - 1]) == precedence(incoming) &&
                     !right_associative(incoming)))) {
                output[written++] = operators[--top];
                output[written++] = ' ';
            }
            operators[top++] = incoming;
        } else {
            return false;
        }
        if (written + top + 2 >= LIMIT) return false;
    }
    while (top > 0) {
        if (operators[top - 1] == '(') return false;
        output[written++] = operators[--top];
        output[written++] = ' ';
    }
    output[written] = '\0';
    return true;
}

static long apply(char operator, long left, long right, bool *ok) {
    switch (operator) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': if (right != 0) return left / right; break;
        case '%': if (right != 0) return left % right; break;
        case '^': {
            if (right < 0) break;
            long result = 1;
            while (right-- > 0) result *= left;
            return result;
        }
    }
    *ok = false;
    return 0;
}

static bool evaluate_postfix(const char *expression, long *answer) {
    long values[LIMIT];
    size_t top = 0;
    for (size_t i = 0; expression[i] != '\0';) {
        if (isspace((unsigned char)expression[i])) {
            ++i;
        } else if (isdigit((unsigned char)expression[i])) {
            char *end;
            long value = strtol(&expression[i], &end, 10);
            if (top == LIMIT) return false;
            values[top++] = value;
            i = (size_t)(end - expression);
        } else if (strchr("+-*/%^", expression[i]) != NULL) {
            if (top < 2) return false;
            long right = values[--top];
            long left = values[--top];
            bool ok = true;
            values[top++] = apply(expression[i++], left, right, &ok);
            if (!ok) return false;
        } else {
            return false;
        }
    }
    if (top != 1) return false;
    *answer = values[0];
    return true;
}

static bool postfix_to_prefix(const char *postfix, char prefix[LIMIT]) {
    char stack[LIMIT][LIMIT];
    size_t top = 0;
    for (size_t i = 0; postfix[i] != '\0';) {
        if (isspace((unsigned char)postfix[i])) {
            ++i;
        } else if (isdigit((unsigned char)postfix[i])) {
            size_t start = i;
            while (isdigit((unsigned char)postfix[i])) ++i;
            size_t length = i - start;
            memcpy(stack[top], postfix + start, length);
            stack[top][length] = '\0';
            ++top;
        } else if (strchr("+-*/%^", postfix[i]) != NULL) {
            if (top < 2) return false;
            char right[LIMIT];
            char left[LIMIT];
            strcpy(right, stack[--top]);
            strcpy(left, stack[--top]);
            int count = snprintf(stack[top++], LIMIT, "%c %s %s", postfix[i++], left, right);
            if (count < 0 || count >= LIMIT) return false;
        } else {
            return false;
        }
    }
    if (top != 1) return false;
    strcpy(prefix, stack[0]);
    return true;
}

static bool evaluate_prefix(const char *expression, long *answer) {
    char copy[LIMIT];
    if (strlen(expression) >= sizeof(copy)) return false;
    strcpy(copy, expression);
    char *tokens[LIMIT];
    size_t count = 0;
    for (char *token = strtok(copy, " "); token != NULL; token = strtok(NULL, " "))
        tokens[count++] = token;
    long values[LIMIT];
    size_t top = 0;
    for (size_t i = count; i-- > 0;) {
        if (isdigit((unsigned char)tokens[i][0])) {
            values[top++] = strtol(tokens[i], NULL, 10);
        } else {
            if (top < 2 || strlen(tokens[i]) != 1) return false;
            long left = values[--top];
            long right = values[--top];
            bool ok = true;
            values[top++] = apply(tokens[i][0], left, right, &ok);
            if (!ok) return false;
        }
    }
    if (top != 1) return false;
    *answer = values[0];
    return true;
}

int main(void) {
    const char *infix = "12 + 3 * (4 - 2)";
    char postfix[LIMIT];
    char prefix[LIMIT];
    long postfix_value;
    long prefix_value;
    if (!infix_to_postfix(infix, postfix) ||
        !postfix_to_prefix(postfix, prefix) ||
        !evaluate_postfix(postfix, &postfix_value) ||
        !evaluate_prefix(prefix, &prefix_value)) {
        fputs("invalid expression\n", stderr);
        return EXIT_FAILURE;
    }
    printf("infix:   %s\npostfix: %s\nprefix:  %s\nvalues:  %ld %ld\n",
           infix, postfix, prefix, postfix_value, prefix_value);
    return EXIT_SUCCESS;
}`,
  ),
  lab(
    'queue-implementations',
    'Circular array queue and linked queue',
    ['circular queue', 'array', 'linked queue', 'FIFO'],
    ['Circular queue implementation using array', 'Queue implementation using linked list'],
    String.raw`
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#define QUEUE_CAPACITY 5

typedef struct {
    int items[QUEUE_CAPACITY];
    size_t head;
    size_t size;
} CircularQueue;

static bool circular_enqueue(CircularQueue *queue, int value) {
    if (queue->size == QUEUE_CAPACITY) return false;
    size_t tail = (queue->head + queue->size) % QUEUE_CAPACITY;
    queue->items[tail] = value;
    ++queue->size;
    return true;
}

static bool circular_dequeue(CircularQueue *queue, int *value) {
    if (queue->size == 0) return false;
    *value = queue->items[queue->head];
    queue->head = (queue->head + 1) % QUEUE_CAPACITY;
    --queue->size;
    return true;
}

typedef struct Node {
    int value;
    struct Node *next;
} Node;

typedef struct {
    Node *head;
    Node *tail;
    size_t size;
} LinkedQueue;

static bool linked_enqueue(LinkedQueue *queue, int value) {
    Node *node = malloc(sizeof(*node));
    if (node == NULL) return false;
    *node = (Node){.value = value, .next = NULL};
    if (queue->tail != NULL) queue->tail->next = node;
    else queue->head = node;
    queue->tail = node;
    ++queue->size;
    return true;
}

static bool linked_dequeue(LinkedQueue *queue, int *value) {
    if (queue->head == NULL) return false;
    Node *node = queue->head;
    *value = node->value;
    queue->head = node->next;
    if (queue->head == NULL) queue->tail = NULL;
    free(node);
    --queue->size;
    return true;
}

int main(void) {
    CircularQueue circular = {0};
    LinkedQueue linked = {0};
    for (int value = 1; value <= 5; ++value) {
        if (!circular_enqueue(&circular, value) || !linked_enqueue(&linked, value))
            return EXIT_FAILURE;
    }
    int left;
    int right;
    circular_dequeue(&circular, &left);
    circular_enqueue(&circular, 6);
    printf("wrapped queue begins with %d\n", left);
    while (circular_dequeue(&circular, &left) && linked_dequeue(&linked, &right))
        printf("circular=%d linked=%d\n", left, right);
    while (linked_dequeue(&linked, &right)) printf("linked=%d\n", right);
    return EXIT_SUCCESS;
}`,
  ),
  lab(
    'binary-search-implementations',
    'Iterative and recursive binary search',
    ['binary search', 'iterative', 'recursive', 'sorted array'],
    ['Binary search in iterative method', 'Binary search in recursive method'],
    String.raw`
#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>

static ptrdiff_t binary_search_iterative(const int *values, size_t count, int target) {
    size_t left = 0;
    size_t right = count;
    while (left < right) {
        size_t middle = left + (right - left) / 2;
        if (values[middle] < target) left = middle + 1;
        else right = middle;
    }
    return left < count && values[left] == target ? (ptrdiff_t)left : -1;
}

static ptrdiff_t binary_search_recursive_range(
    const int *values,
    size_t left,
    size_t right,
    int target
) {
    if (left >= right) return -1;
    size_t middle = left + (right - left) / 2;
    if (values[middle] == target) return (ptrdiff_t)middle;
    if (values[middle] < target)
        return binary_search_recursive_range(values, middle + 1, right, target);
    return binary_search_recursive_range(values, left, middle, target);
}

static ptrdiff_t binary_search_recursive(const int *values, size_t count, int target) {
    return binary_search_recursive_range(values, 0, count, target);
}

int main(void) {
    const int values[] = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    size_t count = sizeof(values) / sizeof(values[0]);
    for (int target = 8; target <= 9; ++target)
        printf("%d: iterative=%td recursive=%td\n",
               target,
               binary_search_iterative(values, count, target),
               binary_search_recursive(values, count, target));
    return 0;
}`,
  ),
  lab(
    'elementary-sorts',
    'Bubble, insertion, and selection sort',
    ['bubble sort', 'insertion sort', 'selection sort'],
    ['Sort an array using bubble sort', 'Sort an array using insertion sort', 'Sort an array using selection sort'],
    String.raw`
#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

static void swap(int *left, int *right) {
    int temporary = *left;
    *left = *right;
    *right = temporary;
}

static void bubble_sort(int *values, size_t count) {
    for (size_t end = count; end > 1; --end) {
        bool changed = false;
        for (size_t i = 1; i < end; ++i) {
            if (values[i - 1] > values[i]) {
                swap(&values[i - 1], &values[i]);
                changed = true;
            }
        }
        if (!changed) break;
    }
}

static void insertion_sort(int *values, size_t count) {
    for (size_t i = 1; i < count; ++i) {
        int key = values[i];
        size_t position = i;
        while (position > 0 && values[position - 1] > key) {
            values[position] = values[position - 1];
            --position;
        }
        values[position] = key;
    }
}

static void selection_sort(int *values, size_t count) {
    for (size_t first = 0; first < count; ++first) {
        size_t minimum = first;
        for (size_t i = first + 1; i < count; ++i)
            if (values[i] < values[minimum]) minimum = i;
        if (minimum != first) swap(&values[first], &values[minimum]);
    }
}

static void print(const char *name, const int *values, size_t count) {
    printf("%-10s", name);
    for (size_t i = 0; i < count; ++i) printf(" %d", values[i]);
    putchar('\n');
}

int main(void) {
    const int input[] = {7, 3, 9, 1, 4, 1};
    int bubble[6];
    int insertion[6];
    int selection[6];
    memcpy(bubble, input, sizeof(input));
    memcpy(insertion, input, sizeof(input));
    memcpy(selection, input, sizeof(input));
    bubble_sort(bubble, 6);
    insertion_sort(insertion, 6);
    selection_sort(selection, 6);
    print("bubble", bubble, 6);
    print("insertion", insertion, 6);
    print("selection", selection, 6);
    return 0;
}`,
  ),
  lab(
    'divide-and-conquer-sorts',
    'Quicksort and merge sort',
    ['quicksort', 'merge sort', 'partition', 'divide and conquer'],
    ['Sort an array using quick sort', 'Sort an array using merge sort'],
    String.raw`
#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void swap(int *left, int *right) {
    int temporary = *left;
    *left = *right;
    *right = temporary;
}

static size_t partition(int *values, size_t low, size_t high) {
    int pivot = values[high - 1];
    size_t boundary = low;
    for (size_t i = low; i + 1 < high; ++i) {
        if (values[i] <= pivot) {
            swap(&values[i], &values[boundary]);
            ++boundary;
        }
    }
    swap(&values[boundary], &values[high - 1]);
    return boundary;
}

static void quick_sort_range(int *values, size_t low, size_t high) {
    while (high - low > 1) {
        size_t pivot = partition(values, low, high);
        if (pivot - low < high - (pivot + 1)) {
            quick_sort_range(values, low, pivot);
            low = pivot + 1;
        } else {
            quick_sort_range(values, pivot + 1, high);
            high = pivot;
        }
    }
}

static void quick_sort(int *values, size_t count) {
    quick_sort_range(values, 0, count);
}

static void merge(int *values, int *scratch, size_t low, size_t middle, size_t high) {
    size_t left = low;
    size_t right = middle;
    size_t out = low;
    while (left < middle && right < high)
        scratch[out++] = values[left] <= values[right] ? values[left++] : values[right++];
    while (left < middle) scratch[out++] = values[left++];
    while (right < high) scratch[out++] = values[right++];
    memcpy(values + low, scratch + low, (high - low) * sizeof(*values));
}

static void merge_sort_range(int *values, int *scratch, size_t low, size_t high) {
    if (high - low < 2) return;
    size_t middle = low + (high - low) / 2;
    merge_sort_range(values, scratch, low, middle);
    merge_sort_range(values, scratch, middle, high);
    merge(values, scratch, low, middle, high);
}

static bool merge_sort(int *values, size_t count) {
    int *scratch = malloc(count * sizeof(*scratch));
    if (scratch == NULL && count != 0) return false;
    merge_sort_range(values, scratch, 0, count);
    free(scratch);
    return true;
}

static void print(const int *values, size_t count) {
    for (size_t i = 0; i < count; ++i) printf("%d%c", values[i], i + 1 == count ? '\n' : ' ');
}

int main(void) {
    const int input[] = {10, -2, 7, 7, 3, 0, 9};
    int quick[7];
    int merged[7];
    memcpy(quick, input, sizeof(input));
    memcpy(merged, input, sizeof(input));
    quick_sort(quick, 7);
    if (!merge_sort(merged, 7)) return EXIT_FAILURE;
    print(quick, 7);
    print(merged, 7);
    return EXIT_SUCCESS;
}`,
  ),
  lab(
    'binary-search-tree-toolkit',
    'Binary search tree toolkit',
    ['BST', 'search', 'maximum', 'delete', 'height', 'node count'],
    ['Search data and find the maximum node in a BST', 'Delete a data node from a BST', 'Find tree height and node count'],
    String.raw`
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int key;
    struct Node *left;
    struct Node *right;
} Node;

static Node *node_new(int key) {
    Node *node = malloc(sizeof(*node));
    if (node == NULL) {
        perror("malloc");
        exit(EXIT_FAILURE);
    }
    *node = (Node){.key = key, .left = NULL, .right = NULL};
    return node;
}

static Node *insert(Node *root, int key) {
    if (root == NULL) return node_new(key);
    if (key < root->key) root->left = insert(root->left, key);
    else if (key > root->key) root->right = insert(root->right, key);
    return root;
}

static Node *search(Node *root, int key) {
    while (root != NULL && root->key != key)
        root = key < root->key ? root->left : root->right;
    return root;
}

static Node *maximum(Node *root) {
    if (root == NULL) return NULL;
    while (root->right != NULL) root = root->right;
    return root;
}

static Node *minimum(Node *root) {
    if (root == NULL) return NULL;
    while (root->left != NULL) root = root->left;
    return root;
}

static Node *erase(Node *root, int key) {
    if (root == NULL) return NULL;
    if (key < root->key) {
        root->left = erase(root->left, key);
    } else if (key > root->key) {
        root->right = erase(root->right, key);
    } else if (root->left == NULL) {
        Node *right = root->right;
        free(root);
        return right;
    } else if (root->right == NULL) {
        Node *left = root->left;
        free(root);
        return left;
    } else {
        Node *successor = minimum(root->right);
        root->key = successor->key;
        root->right = erase(root->right, successor->key);
    }
    return root;
}

static size_t node_count(const Node *root) {
    return root == NULL ? 0 : 1 + node_count(root->left) + node_count(root->right);
}

static size_t height(const Node *root) {
    if (root == NULL) return 0;
    size_t left = height(root->left);
    size_t right = height(root->right);
    return 1 + (left > right ? left : right);
}

static bool valid_between(const Node *root, const int *lower, const int *upper) {
    if (root == NULL) return true;
    if ((lower != NULL && root->key <= *lower) || (upper != NULL && root->key >= *upper))
        return false;
    return valid_between(root->left, lower, &root->key) &&
           valid_between(root->right, &root->key, upper);
}

static void inorder(const Node *root) {
    if (root == NULL) return;
    inorder(root->left);
    printf("%d ", root->key);
    inorder(root->right);
}

static void destroy(Node *root) {
    if (root == NULL) return;
    destroy(root->left);
    destroy(root->right);
    free(root);
}

int main(void) {
    const int keys[] = {50, 30, 70, 20, 40, 60, 80};
    Node *root = NULL;
    for (size_t i = 0; i < sizeof(keys) / sizeof(keys[0]); ++i) root = insert(root, keys[i]);
    printf("found 40=%s max=%d height=%zu nodes=%zu valid=%s\n",
           search(root, 40) ? "yes" : "no",
           maximum(root)->key,
           height(root),
           node_count(root),
           valid_between(root, NULL, NULL) ? "yes" : "no");
    root = erase(root, 20);
    root = erase(root, 30);
    root = erase(root, 50);
    inorder(root);
    putchar('\n');
    destroy(root);
    return EXIT_SUCCESS;
}`,
  ),
  lab(
    'hash-table-toolkit',
    'Hash table toolkit',
    ['hash table', 'chaining', 'insert', 'search', 'delete', 'destroy'],
    ['Create, search, insert, delete, and destroy a hash table'],
    String.raw`
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct Entry {
    int key;
    int value;
    struct Entry *next;
} Entry;

typedef struct {
    Entry **buckets;
    size_t capacity;
    size_t size;
} HashTable;

static size_t bucket_for(int key, size_t capacity) {
    uint32_t mixed = (uint32_t)key * UINT32_C(2654435761);
    return (size_t)(mixed % capacity);
}

static bool table_create(HashTable *table, size_t capacity) {
    if (capacity == 0) return false;
    table->buckets = calloc(capacity, sizeof(*table->buckets));
    if (table->buckets == NULL) return false;
    table->capacity = capacity;
    table->size = 0;
    return true;
}

static Entry *table_find(HashTable *table, int key) {
    if (table->capacity == 0) return NULL;
    size_t bucket = bucket_for(key, table->capacity);
    for (Entry *entry = table->buckets[bucket]; entry != NULL; entry = entry->next)
        if (entry->key == key) return entry;
    return NULL;
}

static bool table_insert(HashTable *table, int key, int value) {
    Entry *existing = table_find(table, key);
    if (existing != NULL) {
        existing->value = value;
        return true;
    }
    size_t bucket = bucket_for(key, table->capacity);
    Entry *entry = malloc(sizeof(*entry));
    if (entry == NULL) return false;
    *entry = (Entry){.key = key, .value = value, .next = table->buckets[bucket]};
    table->buckets[bucket] = entry;
    ++table->size;
    return true;
}

static bool table_delete(HashTable *table, int key) {
    size_t bucket = bucket_for(key, table->capacity);
    Entry **link = &table->buckets[bucket];
    while (*link != NULL && (*link)->key != key) link = &(*link)->next;
    if (*link == NULL) return false;
    Entry *removed = *link;
    *link = removed->next;
    free(removed);
    --table->size;
    return true;
}

static void table_destroy(HashTable *table) {
    for (size_t bucket = 0; bucket < table->capacity; ++bucket) {
        Entry *entry = table->buckets[bucket];
        while (entry != NULL) {
            Entry *next = entry->next;
            free(entry);
            entry = next;
        }
    }
    free(table->buckets);
    *table = (HashTable){0};
}

int main(void) {
    HashTable table = {0};
    if (!table_create(&table, 11)) return EXIT_FAILURE;
    for (int key = 0; key < 20; ++key)
        if (!table_insert(&table, key, key * key)) return EXIT_FAILURE;
    table_insert(&table, 7, 700);
    Entry *entry = table_find(&table, 7);
    printf("key=7 value=%d size=%zu\n", entry ? entry->value : -1, table.size);
    table_delete(&table, 7);
    printf("after delete: %s\n", table_find(&table, 7) ? "present" : "absent");
    table_destroy(&table);
    return EXIT_SUCCESS;
}`,
  ),
];

export const collegeDsaCoverage = collegeDsaLabs.flatMap((entry) =>
  entry.covers.map((assignment) => ({ assignment, topicId: `college-dsa-${entry.id}` })),
);

export const collegeDsaLabByTopicId = new Map(
  collegeDsaLabs.map((entry) => [`college-dsa-${entry.id}`, entry]),
);
