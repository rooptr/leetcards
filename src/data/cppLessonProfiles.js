const profile = ({
  definition,
  explanation,
  prediction,
  steps,
  failure,
  application,
  example,
  code,
  standard = 'C++20',
}) => ({
  definition,
  explanation,
  prediction,
  steps,
  failure,
  application,
  example,
  code,
  standard,
});

export const cppLessonProfiles = {
  'cpp-build': profile({
    definition: 'A C++ build turns source files into a program in two major stages. The compiler translates each preprocessed source file into an object file; the linker then resolves cross-file names, combines object files and libraries, and produces the executable or firmware image.',
    explanation: 'Each .cpp file and the headers it includes form one translation unit. The compiler checks and generates code for that unit without seeing the private contents of other units. The linker is where a declaration must finally meet one compatible definition, including mangled C++ names, instantiated templates, runtime support, and libraries.',
    prediction: 'If main.cpp can see a declaration for add but no object file supplies its definition, which stage fails and why?',
    steps: [
      'Preprocess main.cpp and math.cpp separately, expanding each included header into its own translation unit.',
      'Compile both translation units into object files containing machine code, symbol tables, and unresolved references.',
      'Give the object files and required libraries to the linker.',
      'Resolve main’s reference to add, assign final addresses, apply relocations, and emit the program.',
    ],
    failure: 'A compiler error belongs to one translation unit: bad syntax, types, or unavailable declarations. A linker error means compilation succeeded but a required definition is missing, duplicated, incompatible, or hidden by library order or ABI differences. Mixing flags that change class layout or language mode can create an ODR violation even when the link succeeds.',
    application: 'An STM32 C++ firmware build compiles drivers, application state machines, startup support, and generated code separately, then links them with the ARM runtime under a linker script that places vectors, code, data, and stacks at exact addresses.',
    example: 'Build two translation units, deliberately omit math.cpp from the link, read the undefined-reference message, then add math.o and inspect the resolved symbol.',
    code: `// math.hpp
#pragma once
int add(int left, int right);

// math.cpp
#include "math.hpp"
int add(int left, int right) {
  return left + right;
}

// main.cpp
#include "math.hpp"
#include <iostream>

int main() {
  std::cout << add(20, 22) << '\\n';
}`,
  }),

  'cpp-namespaces': profile({
    definition: 'A namespace groups names so independent code can use the same short identifier without collision. Linkage answers a different question: whether declarations in one translation unit refer to the same entity as declarations elsewhere. A translation unit is one source file after preprocessing.',
    explanation: 'Namespace qualification chooses a name, while linkage determines that name’s program-wide identity. An unnamed namespace gives its members internal linkage in that translation unit. An inline function or variable may be defined identically in multiple translation units, which is how header-defined entities can satisfy the one-definition rule.',
    prediction: 'If two source files each define an unnamed-namespace variable called counter, do they share one object?',
    steps: [
      'Resolve telemetry::counter by searching the telemetry namespace, not the global namespace.',
      'Determine whether the selected declaration has internal, external, or no linkage.',
      'Across translation units, match only declarations that have the same language linkage and compatible type.',
      'Apply the one-definition rule: one program entity must not acquire conflicting definitions.',
    ],
    failure: 'A using-directive can make overload sets ambiguous. A non-inline definition placed in a header creates one external definition per including translation unit and usually causes duplicate symbols. Two definitions that differ only because of macros can violate the ODR without a reliable diagnostic.',
    application: 'A firmware codebase keeps vendor register names under stm32, protocol code under canopen, and product behavior under app while unnamed-namespace helpers remain private to each driver source file.',
    example: 'Contrast one inline variable in a header, which denotes one program entity, with one unnamed-namespace variable, which creates a separate object in every translation unit.',
    code: `// counters.hpp
#pragma once

namespace telemetry {
inline unsigned packets_sent = 0;
void record_packet();
}

// counters.cpp
#include "counters.hpp"

namespace {
unsigned writes_in_this_file = 0;
}

void telemetry::record_packet() {
  ++packets_sent;
  ++writes_in_this_file;
}`,
  }),

  'cpp-object-model': profile({
    definition: 'A C++ object is a region of storage that has a type and a lifetime. Its lifetime begins when the language says an object of that type has been created in suitable storage and ends when it is destroyed or its storage is reused. Value semantics means a type defines what copying, moving, comparison, and independent ownership mean for its values.',
    explanation: 'Storage alone is not enough: bytes can exist before an object’s lifetime starts and after it ends. During a live object’s lifetime, its invariants and type rules govern legal access. Copying should create an independent value unless the type explicitly represents shared identity; moving transfers a value’s resources while leaving the source valid but usually unspecified.',
    prediction: 'After a std::string is moved from, may it be destroyed and assigned to, and may its old text be assumed to remain?',
    steps: [
      'Obtain storage with the size and alignment required by the type.',
      'Begin the object’s lifetime through initialization or an allowed implicit-lifetime rule.',
      'Perform operations only while the object is alive and preserve its class invariant.',
      'End the lifetime, run destruction when required, and only then reuse or release the storage.',
    ],
    failure: 'Reading through a pointer after the object’s lifetime ended is undefined even if the bytes still look unchanged. Treating a moved-from value as if it retained its previous contents confuses “valid” with “unchanged.” Byte-copying a non-trivially-copyable object bypasses its ownership rules.',
    application: 'A message object owns a payload buffer and checksum state. Copying it creates an independent message, moving it transfers the buffer to a queue without copying bytes, and destruction releases the final owner’s storage.',
    example: 'Trace one std::string through construction, copy, move, assignment to the moved-from source, and destruction.',
    code: `#include <cassert>
#include <string>
#include <utility>

int main() {
  std::string original = "sensor-ready";
  std::string copy = original;
  std::string moved = std::move(original);

  assert(copy == "sensor-ready");
  assert(moved == "sensor-ready");

  original = "reused safely";
  assert(original == "reused safely");
}`,
  }),

  'cpp-constructors': profile({
    definition: 'A constructor is a special member function that runs when an object’s lifetime begins and establishes its initial valid state. A destructor is a special member function that runs when that object’s lifetime ends and releases resources owned by it. Initialization is the language-controlled process that creates the object, its base classes, and its data members.',
    explanation: 'The constructor body is not where member construction starts. First, virtual bases are initialized, then direct bases, then data members in declaration order inside the class; only after that does the constructor body run. When lifetime ends, the destructor body runs, then members and bases are destroyed in the reverse of their construction order. The initializer list chooses how members are constructed; assignment inside the body happens too late to replace initialization.',
    prediction: 'If the initializer list writes second(value), first(second) but first is declared before second, which member is initialized first and what value can first legally read?',
    steps: [
      'Allocate suitably aligned storage for the complete object.',
      'Initialize base classes, then members in declaration order using default member initializers or the constructor’s initializer list.',
      'Enter the constructor body only after every base and member already exists.',
      'Use the object while its invariant remains true.',
      'At lifetime end, run the destructor body, then destroy members and bases in reverse construction order.',
    ],
    failure: 'Writing initializer-list entries in a preferred visual order does not change declaration order. Reading a later-declared member while initializing an earlier member can read an indeterminate value. Assigning a resource-owning member in the constructor body may first default-construct it and then replace it. Throwing during construction destroys only the bases and members that completed construction; the incomplete object’s destructor does not run.',
    application: 'A serial-port object opens a descriptor in its constructor only after its configuration members are valid. Its destructor closes that descriptor, so every return and exception path has the same cleanup rule. Member order determines whether the configuration exists before the descriptor wrapper needs it.',
    example: 'Construct the sample through its default, parameterized, copy, move, delegating, converting, explicit, defaulted, and deleted paths; then use the type traits and virtual base owner to distinguish trivial, non-trivial, defaulted, and virtual destruction.',
    code: `#include <algorithm>
#include <cassert>
#include <cstddef>
#include <memory>
#include <type_traits>
#include <utility>

struct PlainReading {
  int value{};
};

class Buffer {
 public:
  Buffer() : Buffer(4) {}

  explicit Buffer(std::size_t size)
      : size_(size),
        data_(std::make_unique<int[]>(size_)) {}

  Buffer(const Buffer& other)
      : Buffer(other.size_) {
    std::copy_n(other.data_.get(), size_, data_.get());
  }

  Buffer(Buffer&&) noexcept = default;
  ~Buffer() = default;

  std::size_t size() const {
    return size_;
  }

 private:
  std::size_t size_{};
  std::unique_ptr<int[]> data_;
};

class ImplicitDuration {
 public:
  ImplicitDuration(int milliseconds)
      : milliseconds_(milliseconds) {}

 private:
  int milliseconds_;
};

class ExplicitDuration {
 public:
  explicit ExplicitDuration(int milliseconds)
      : milliseconds_(milliseconds) {}

 private:
  int milliseconds_;
};

struct NonCopyableDevice {
  NonCopyableDevice() = default;
  NonCopyableDevice(const NonCopyableDevice&) = delete;
  ~NonCopyableDevice() = default;
};

struct Interface {
  virtual ~Interface() = default;
};

struct Concrete final : Interface {
  ~Concrete() override = default;
};

void accept_duration(ImplicitDuration) {}

int main() {
  static_assert(std::is_trivially_destructible_v<PlainReading>);
  static_assert(!std::is_trivially_destructible_v<Buffer>);

  Buffer default_buffer;
  Buffer sized_buffer{8};
  Buffer copied{sized_buffer};
  Buffer moved{std::move(copied)};

  accept_duration(5);
  ExplicitDuration explicit_duration{5};
  std::unique_ptr<Interface> owner = std::make_unique<Concrete>();

  assert(default_buffer.size() == 4);
  assert(sized_buffer.size() == 8);
  assert(moved.size() == 8);
  (void)explicit_duration;
  (void)owner;
}`,
  }),

  'cpp-const': profile({
    definition: 'Const correctness uses the type system to state which objects and operations may modify observable state. A const object can call only const-qualified member functions; a const member function receives a pointer to const for its object. mutable permits carefully selected non-observable bookkeeping to change inside a const operation.',
    explanation: 'Const is a contract propagated through references, pointers, return types, and member functions. It does not make physical memory immutable, and it does not automatically make an object thread-safe. Overloading on const lets read-only objects receive read-only access while mutable objects receive mutable access.',
    prediction: 'Why should operator[] on a const buffer return const int&, while the non-const overload may return int&?',
    steps: [
      'Decide whether the operation changes the value users can observe.',
      'Mark read-only parameters and member functions const at the first ownership boundary.',
      'Return const access when mutation through the result would violate the original object’s constness.',
      'Use mutable only for state such as a cache or lock that does not change the logical value.',
    ],
    failure: 'Casting away const and writing is undefined when the original object was actually defined const. Returning a mutable pointer or reference from a const function breaks the contract. A mutable cache still needs synchronization when several threads may update it.',
    application: 'A memory-map parser exposes read-only section views to validation code while a builder exposes mutable access only before the image is sealed.',
    example: 'Implement matching const and non-const indexing overloads and verify that mutation compiles only through the non-const object.',
    code: `#include <array>
#include <cstddef>

class Samples {
 public:
  int& operator[](std::size_t index) {
    return values_[index];
  }

  const int& operator[](std::size_t index) const {
    return values_[index];
  }

 private:
  std::array<int, 4> values_{};
};`,
  }),

  'cpp-references': profile({
    definition: 'A reference is an alias for an existing object or function. An lvalue expression identifies an object with continuing identity; an rvalue expression is typically a temporary or a value whose resources may be reused. Reference collapsing is the rule that combines nested reference types and makes perfect forwarding possible.',
    explanation: 'T& binds to lvalues. T&& normally binds to rvalues, but when T is a deduced template parameter, T&& is a forwarding reference and can also bind to lvalues. Collapsing keeps an lvalue reference whenever either side contributes &: only && combined with && remains &&. std::forward restores the caller’s value category.',
    prediction: 'When forward_value receives a named std::string lvalue, what does T become and what does T&& collapse to?',
    steps: [
      'Classify the argument expression as an lvalue or rvalue.',
      'Deduce T before applying the written reference qualifier.',
      'Collapse nested references: &, & produces &; &, && produces &; &&, & produces &; &&, && produces &&.',
      'Use std::forward<T> only when preserving the original category is required.',
    ],
    failure: 'Returning a reference to a local object creates a dangling reference. Applying std::move does not move anything by itself; it casts to an rvalue and permits a later operation to move. Forwarding the same rvalue more than once can consume it repeatedly.',
    application: 'A generic queue emplacement function forwards constructor arguments so lvalues are copied when required and temporary buffers can transfer ownership without an extra copy.',
    example: 'Call one forwarding function with an int, int&, const int&, and temporary std::string, then inspect the selected overload.',
    code: `#include <utility>

void consume(const int&);
void consume(int&&);

template <class T>
void forward_value(T&& value) {
  consume(std::forward<T>(value));
}

void run() {
  int count = 4;
  forward_value(count);
  forward_value(9);
}`,
  }),

  'cpp-overload': profile({
    definition: 'Overload resolution is the compile-time process that chooses one function from declarations sharing a name. It first builds the candidate set, removes functions that cannot accept the arguments, ranks the required conversions, and applies tie-break rules for templates and cv/ref qualifications.',
    explanation: 'The compiler does not simply choose the visually closest declaration. Exact matches beat promotions, promotions beat broader standard conversions, and user-defined conversions are ranked later. Constraints can remove template candidates before ranking. If no unique best viable function remains, the call is ill-formed.',
    prediction: 'Given f(int), f(long), and a constrained integral template, which candidate receives the literal 1 and which rule makes it better?',
    steps: [
      'Collect visible functions named by ordinary lookup and argument-dependent lookup.',
      'Discard candidates with the wrong arity, failed constraints, or impossible conversions.',
      'Rank each viable candidate’s conversion sequence for every argument.',
      'Apply non-template, template-specialization, and cv/ref tie-break rules until one best candidate remains.',
    ],
    failure: 'Adding a converting constructor can make an unrelated call ambiguous. A braced initializer may prefer std::initializer_list overloads. A function hidden in a derived class can remove the base overload set from ordinary lookup unless using restores it.',
    application: 'A register API overloads write for strongly typed enum flags and raw unsigned values while concepts prevent signed or floating-point arguments from entering the hardware boundary.',
    example: 'Predict calls with int, short, long, and a scoped enum before compiling, then compare the selected overloads.',
    code: `#include <concepts>
#include <iostream>

void select(int) {
  std::cout << "int\\n";
}

void select(long) {
  std::cout << "long\\n";
}

template <std::integral T>
void select(T) {
  std::cout << "integral template\\n";
}

int main() {
  select(1);
  select(1L);
  select(static_cast<short>(1));
}`,
  }),

  'cpp-copy-move': profile({
    definition: 'Copy semantics create a new object with an independent representation of the same value. Move semantics let a new object take over resources from an expiring object instead of duplicating them. Copy and move constructors create objects; copy and move assignment replace the value of objects that already exist.',
    explanation: 'The compiler may declare or delete special members based on the members you define and the capabilities of subobjects. Resource-owning classes must prevent two owners from releasing the same resource. A move operation transfers the handle, leaves the source valid, and should usually be noexcept so containers can move during reallocation without weakening exception guarantees.',
    prediction: 'When a vector grows, why can a potentially throwing move constructor cause it to copy elements instead?',
    steps: [
      'For a copy, allocate or acquire independent state before publishing the new object.',
      'For a move, take the source handle and replace the source with its empty valid state.',
      'For assignment, handle self-assignment and release the destination’s previous resource exactly once.',
      'Declare noexcept when the move truly cannot fail, allowing containers to preserve strong guarantees efficiently.',
    ],
    failure: 'A shallow copy of a raw owning pointer creates double deletion. Forgetting to reset the moved-from owner does the same. Defining a destructor can suppress implicitly generated moves. A move marked noexcept that throws terminates the program.',
    application: 'A packet buffer transfers a heap allocation into a transmit queue without copying payload bytes, while copying a configuration object produces an independent configuration.',
    example: 'Trace a vector reallocation for an element type with noexcept move, then remove noexcept and observe whether copies replace moves.',
    code: `#include <cstddef>
#include <memory>
#include <utility>

class Buffer {
 public:
  explicit Buffer(std::size_t size)
      : size_(size), data_(std::make_unique<std::byte[]>(size)) {}

  Buffer(const Buffer& other)
      : Buffer(other.size_) {
    for (std::size_t index = 0; index < size_; ++index) {
      data_[index] = other.data_[index];
    }
  }

  Buffer(Buffer&&) noexcept = default;
  Buffer& operator=(const Buffer&) = delete;
  Buffer& operator=(Buffer&&) noexcept = default;

 private:
  std::size_t size_;
  std::unique_ptr<std::byte[]> data_;
};`,
  }),

  'cpp-raii': profile({
    definition: 'RAII—resource acquisition is initialization—stores ownership inside an object whose lifetime is controlled by scope. Construction acquires or accepts a valid resource; destruction releases it. The same cleanup therefore occurs on normal return, early return, and exception unwinding.',
    explanation: 'RAII is not limited to heap memory. A resource can be a file descriptor, lock, socket, transaction, DMA mapping, or temporary configuration. The owner must have one clear empty state, prevent accidental copying when ownership is unique, and transfer ownership explicitly through move operations.',
    prediction: 'If a function returns early after acquiring a descriptor through a scoped owner, which language event performs close?',
    steps: [
      'Acquire the resource and immediately place it in an owner that can represent success or empty state.',
      'Keep resource-dependent invariants inside that owner instead of distributing cleanup flags across callers.',
      'Transfer unique ownership only by move and make observers non-owning.',
      'On every scope exit, let destruction release the resource exactly once.',
    ],
    failure: 'Manual cleanup is skipped by early returns and exceptions. Two owners created from the same raw handle release it twice. A destructor that throws during stack unwinding can terminate the program. Releasing in the wrong order can destroy a dependency before its user.',
    application: 'A Linux service wraps each accepted socket in a move-only descriptor. Parsing may return or throw at many points, but the final owner always closes the socket.',
    example: 'Wrap a file descriptor, move it into a worker object, and trace the source becoming empty before the worker’s destructor closes the descriptor.',
    code: `#include <unistd.h>
#include <utility>

class FileDescriptor {
 public:
  explicit FileDescriptor(int value = -1) noexcept : value_(value) {}

  ~FileDescriptor() {
    if (value_ >= 0) {
      ::close(value_);
    }
  }

  FileDescriptor(const FileDescriptor&) = delete;
  FileDescriptor& operator=(const FileDescriptor&) = delete;

  FileDescriptor(FileDescriptor&& other) noexcept
      : value_(std::exchange(other.value_, -1)) {}

 private:
  int value_;
};`,
  }),

  'cpp-smart-pointers': profile({
    definition: 'A smart pointer is a C++ object that stores a pointer together with an ownership policy. std::unique_ptr represents one owner, std::shared_ptr represents shared lifetime through a control block, and std::weak_ptr observes a shared object without keeping it alive.',
    explanation: 'Choose the ownership model before choosing the smart pointer. unique_ptr is the default for exclusive ownership and transfers only by move. shared_ptr increments and decrements a reference count but cannot by itself break ownership cycles. weak_ptr must be locked to obtain a temporary shared owner before access.',
    prediction: 'If a parent and child hold shared_ptr to each other, why do both reference counts remain nonzero after external owners disappear?',
    steps: [
      'Draw the ownership graph and mark which edges must keep an object alive.',
      'Use unique_ptr for one owning edge and raw pointers or references for non-owning access with a proven lifetime.',
      'Use shared_ptr only when several independent owners genuinely control lifetime.',
      'Replace at least one edge in every shared ownership cycle with weak_ptr.',
    ],
    failure: 'Constructing two shared_ptr objects independently from the same raw pointer creates two control blocks and double deletion. Shared cycles leak. Returning a raw pointer from a temporary owner creates a dangling observer. shared_ptr reference counting does not make the pointed object thread-safe.',
    application: 'A UI tree gives each parent unique ownership of children, while a task graph uses shared ownership for nodes retained by several queued operations and weak back-edges for dependency observers.',
    example: 'Build a parent-child pair, observe the cycle with two shared owners, change the child’s parent edge to weak_ptr, and verify destruction.',
    code: `#include <cassert>
#include <memory>
#include <vector>

struct Device {
  explicit Device(int identifier) : id(identifier) {}
  int id;
};

struct Node {
  std::weak_ptr<Node> parent;
  std::vector<std::shared_ptr<Node>> children;
};

int main() {
  auto exclusive = std::make_unique<Device>(7);
  auto transferred = std::move(exclusive);
  assert(!exclusive && transferred->id == 7);

  auto root = std::make_shared<Node>();
  auto child = std::make_shared<Node>();
  child->parent = root;
  root->children.push_back(child);

  assert(root.use_count() == 1);
  assert(child.use_count() == 2);
  if (auto parent = child->parent.lock()) {
    assert(parent == root);
  }

  root->children.clear();
  child.reset();
}`,
  }),

  'cpp-composition': profile({
    definition: 'Composition builds a class from member objects that each own part of its state or behavior. A class invariant is a condition that must be true after construction and before and after every public operation. Composition lets each member enforce the invariant for the state it owns.',
    explanation: 'A composed object has direct control over construction order, lifetime, and access to its parts. It should expose operations that preserve a meaningful whole instead of exposing public fields that callers can combine into invalid states. Prefer composition when the relationship is “has a” and substituting the part for the whole would make no sense.',
    prediction: 'If a UART driver exposes baud divisor and clock source as unrelated public fields, which invalid combinations can callers create?',
    steps: [
      'Write the class invariant in one sentence before choosing members.',
      'Assign each piece of mutable state to the smallest member that can keep it valid.',
      'Construct members so the complete object is valid before its constructor returns.',
      'Expose operations that move from one valid state to another without revealing partial updates.',
    ],
    failure: 'Public representation lets callers bypass validation. Storing two copies of the same fact lets them disagree. Inheriting only to reuse implementation creates a false substitutability promise. A constructor that publishes this before construction completes exposes a partial object.',
    application: 'A UART driver composes a clock reference, register view, validated baud configuration, and receive buffer; callers request operations instead of editing register fields independently.',
    example: 'Replace public baud and divisor fields with one validated configure function that either commits a coherent configuration or leaves the previous state unchanged.',
    code: `#include <cstdint>
#include <optional>

class UartConfig {
 public:
  static std::optional<UartConfig> create(
      std::uint32_t peripheral_clock,
      std::uint32_t baud) {
    if (baud == 0 || peripheral_clock < baud) {
      return std::nullopt;
    }
    return UartConfig(peripheral_clock / baud);
  }

  std::uint32_t divisor() const {
    return divisor_;
  }

 private:
  explicit UartConfig(std::uint32_t divisor) : divisor_(divisor) {}
  std::uint32_t divisor_;
};`,
  }),

  'cpp-polymorphism': profile({
    definition: 'Inheritance declares that a derived type contains a base subobject and may be used where the base interface promises substitutability. Virtual dispatch chooses an override from the object’s dynamic type when a virtual function is called through a base pointer or reference.',
    explanation: 'The static type controls what operations are visible; the dynamic type identifies the most-derived live object and selects the final overrider. A polymorphic base intended for deletion through a base pointer needs a virtual destructor so destruction reaches the derived part before the base part.',
    prediction: 'If Base has a non-virtual destructor and a Derived object is deleted through Base*, which part of destruction is not guaranteed to run?',
    steps: [
      'Construct the base subobject before the derived members and body.',
      'Store or pass the object through a base pointer or reference without slicing it.',
      'At a virtual call, use the object’s dynamic type to select the final override.',
      'At deletion through the base interface, dispatch the virtual destructor and destroy derived state before base state.',
    ],
    failure: 'Passing a derived object by base value slices off the derived part. Calling virtual functions from constructors or destructors observes only the currently constructed or destructed class layer. A non-virtual base destructor makes polymorphic deletion undefined. Inheritance used only for code reuse often violates substitutability.',
    application: 'A hardware test runner stores different instrument drivers behind one Device interface; each driver overrides read and reset while virtual destruction releases model-specific connections.',
    example: 'Create a derived driver through unique_ptr<Device>, compare a virtual call through Device& with a copied DeviceView value, and observe how the value copy slices away the derived state.',
    code: `#include <cassert>
#include <memory>

struct Device {
  virtual ~Device() = default;
  virtual int read() const = 0;
};

struct Sensor final : Device {
  explicit Sensor(int value) : value_(value) {}

  int read() const override {
    return value_;
  }

 private:
  int value_;
};

std::unique_ptr<Device> make_sensor() {
  return std::make_unique<Sensor>(42);
}

struct DeviceView {
  virtual ~DeviceView() = default;
  virtual int kind() const { return 0; }
};

struct DetailedView final : DeviceView {
  int kind() const override { return 1; }
  int detail{9};
};

int main() {
  auto sensor = make_sensor();
  assert(sensor->read() == 42);

  DetailedView detailed;
  DeviceView& reference = detailed;
  assert(reference.kind() == 1);

  DeviceView sliced = detailed;
  assert(sliced.kind() == 0);
}`,
  }),

  'cpp-templates': profile({
    definition: 'A template describes a family of declarations parameterized by types, values, or other templates. Instantiation forms a concrete class or function from chosen arguments. A concept is a named compile-time predicate used to state which arguments make the template’s operations valid.',
    explanation: 'Templates are compiled where enough definition is visible to instantiate them, which is why most template definitions live in headers. Constraints are part of the interface: they remove invalid candidates early and produce diagnostics near the caller. Generic code should depend on required operations, not accidental details of one example type.',
    prediction: 'If a register helper uses bitwise &, what requirement must its concept state before a floating-point type reaches the function body?',
    steps: [
      'Identify which types or values vary and which algorithmic rule remains unchanged.',
      'Write the operations and semantic promises the implementation actually requires.',
      'Express those requirements with standard or custom concepts.',
      'Instantiate with a concrete argument and verify generated code and diagnostics at the boundary.',
    ],
    failure: 'An unconstrained template can fail deep inside its body with irrelevant diagnostics. Definitions hidden in one .cpp file cannot be instantiated freely elsewhere. Overly specific concepts reject valid types; purely syntactic concepts can accept operations whose behavior violates the algorithm’s semantic needs.',
    application: 'A register library constrains bit operations to unsigned types, while reusable Stack<Packet> and Queue<Event> containers preserve ownership and ordering without duplicating their implementation for each payload type.',
    example: 'Instantiate a fixed-capacity Stack<int>, a Queue<const char*>, and swap_values<unsigned>; then make an unsupported push observable as a false result instead of memory corruption.',
    code: `#include <array>
#include <cassert>
#include <concepts>
#include <cstddef>
#include <deque>
#include <utility>

template <class T>
void swap_values(T& left, T& right) {
  T temporary = std::move(left);
  left = std::move(right);
  right = std::move(temporary);
}

template <class T, std::size_t Capacity>
class Stack {
 public:
  bool push(T value) {
    if (size_ == Capacity) {
      return false;
    }
    values_[size_++] = std::move(value);
    return true;
  }

  T pop() {
    assert(size_ > 0);
    return std::move(values_[--size_]);
  }

 private:
  std::array<T, Capacity> values_{};
  std::size_t size_{};
};

template <class T>
class Queue {
 public:
  void push(T value) {
    values_.push_back(std::move(value));
  }

  T pop() {
    assert(!values_.empty());
    T value = std::move(values_.front());
    values_.pop_front();
    return value;
  }

 private:
  std::deque<T> values_;
};

template <std::unsigned_integral Register>
constexpr Register set_bits(Register value, Register mask) {
  return static_cast<Register>(value | mask);
}

int main() {
  Stack<int, 2> stack;
  assert(stack.push(10));
  assert(stack.push(20));
  assert(!stack.push(30));
  assert(stack.pop() == 20);

  Queue<const char*> queue;
  queue.push("first");
  queue.push("second");
  assert(queue.pop()[0] == 'f');

  unsigned left = 1;
  unsigned right = 2;
  swap_values(left, right);
  assert(left == 2 && right == 1);
  static_assert(set_bits(0b0010u, 0b1000u) == 0b1010u);
}`,
  }),

  'cpp-constexpr': profile({
    definition: 'Constant evaluation executes eligible C++ expressions during compilation. constexpr marks a variable or function as usable in constant expressions when its actual inputs and operations satisfy the constant-evaluation rules; consteval requires every call to be evaluated at compile time.',
    explanation: 'A constexpr function is still an ordinary function and may run at runtime for non-constant inputs. During constant evaluation, forbidden actions such as undefined behavior, inaccessible runtime state, or disallowed allocation cause the expression to stop being a valid constant expression. Compile-time results can determine array sizes, lookup tables, template arguments, and static assertions.',
    prediction: 'Does declaring a function constexpr guarantee that a call with a runtime sensor value executes during compilation?',
    steps: [
      'Write the calculation as a deterministic function of explicit inputs.',
      'Mark the function constexpr and keep its constant-evaluated path within allowed operations.',
      'Call it with compile-time-known inputs when a constant expression is required.',
      'Use static_assert or a type/array boundary to prove that evaluation occurred during compilation.',
    ],
    failure: 'constexpr is not a universal performance directive. Large compile-time work can slow builds and enlarge diagnostics. A function may be constexpr-capable yet run at runtime. Depending on overflow or undefined behavior causes constant evaluation to reject code that might have appeared to work at runtime.',
    application: 'Embedded firmware builds a CRC table and validates clock-divider calculations at compile time, removing startup work and making invalid hardware parameters fail the build.',
    example: 'Generate a small lookup table in a constexpr function and verify one entry with static_assert.',
    code: `#include <array>
#include <cstddef>

constexpr std::array<unsigned, 8> squares() {
  std::array<unsigned, 8> values{};
  for (std::size_t index = 0; index < values.size(); ++index) {
    values[index] = static_cast<unsigned>(index * index);
  }
  return values;
}

constexpr auto table = squares();
static_assert(table[6] == 36);`,
  }),

  'cpp-stl': profile({
    definition: 'The C++ standard library provides containers that own elements, iterators that identify positions, algorithms that operate on ranges, and utilities that encode common ownership and value patterns. The STL style separates storage from algorithms through iterator or range interfaces.',
    explanation: 'Container choice is a behavior decision: contiguous access, iterator stability, insertion cost, ordering, lookup complexity, and allocation all differ. Algorithms work over ranges and express operations such as sorting, searching, transforming, and reducing without taking ownership of the container.',
    prediction: 'After vector growth reallocates its storage, which pointers, references, and iterators into the old storage remain valid?',
    steps: [
      'Choose the required ownership, ordering, lookup, and mutation behavior before selecting a container.',
      'Record the container’s invalidation rules for every operation used by the program.',
      'Pass iterator pairs or ranges to algorithms while the underlying storage remains alive and stable.',
      'Measure allocation and locality when the code runs under embedded or latency constraints.',
    ],
    failure: 'Using an invalidated iterator is undefined. operator[] does not perform bounds checks. shared ownership of a container does not synchronize mutation. Choosing list for frequent insertion can still lose badly when traversal locality dominates.',
    application: 'A firmware configuration tool stores contiguous records in vector, orders them with ranges::sort, and uses lower_bound for lookup while reserving capacity before retaining references.',
    example: 'Reserve capacity, record a pointer to the first vector element, grow within capacity, then exceed capacity and inspect the address change and invalidation boundary.',
    code: `#include <algorithm>
#include <string>
#include <vector>

struct Record {
  int id;
  std::string name;
};

void order_records(std::vector<Record>& records) {
  std::ranges::sort(records, {}, &Record::id);
}`,
  }),

  'cpp-iterators': profile({
    definition: 'An iterator is a position-like object whose category states which traversal and access operations are supported. A range combines a beginning with an ending condition. begin/end traverse forward, cbegin/cend enforce read-only access, and rbegin/rend adapt traversal to run in reverse.',
    explanation: 'Algorithms rely on iterator capabilities rather than container names. Input iterators support one-pass reading; forward and bidirectional iterators add stronger traversal; random-access and contiguous iterators add arithmetic and layout guarantees. The ending position is a boundary and is never dereferenced. Every iterator also depends on the continued lifetime and non-invalidating state of its underlying range.',
    prediction: 'Why may an algorithm requiring random-access iterators accept vector iterators but reject list iterators?',
    steps: [
      'Identify the weakest traversal capability the algorithm needs.',
      'Form a valid range whose end is reachable from its begin under that iterator model.',
      'Choose mutable, const, forward, or reverse endpoints according to the access contract.',
      'Keep the underlying range alive and avoid operations that invalidate active positions.',
    ],
    failure: 'Dereferencing end, cend, or rend is invalid. Comparing iterators from unrelated containers is invalid. Modifying a container during traversal can invalidate the current and future positions. A lazy view may outlive the source it references and then contain dangling iterators.',
    application: 'A packet inspector exposes a read-only range to validation code, uses reverse iterators to inspect the newest records first, and keeps mutation behind an owner that knows every invalidation rule.',
    example: 'Walk one vector through begin/end, cbegin/cend, and rbegin/rend; verify which forms permit mutation and confirm that none of the ending positions is dereferenced.',
    code: `#include <cassert>
#include <iterator>
#include <vector>

int main() {
  std::vector<int> values{1, 2, 3};

  for (auto iterator = std::begin(values);
       iterator != std::end(values);
       ++iterator) {
    *iterator *= 2;
  }

  int forward_sum = 0;
  for (auto iterator = std::cbegin(values);
       iterator != std::cend(values);
       ++iterator) {
    forward_sum += *iterator;
  }

  std::vector<int> reversed;
  for (auto iterator = std::rbegin(values);
       iterator != std::rend(values);
       ++iterator) {
    reversed.push_back(*iterator);
  }

  assert(forward_sum == 12);
  assert((reversed == std::vector<int>{6, 4, 2}));
}`,
  }),

  'cpp-modern-syntax': profile({
    definition: 'Modern C++ language features such as auto, decltype, nullptr, scoped enumerations, range-based for loops, structured bindings, and inline variables move type intent into compiler-checked syntax. They reduce repetition without removing the underlying type, lifetime, or ownership rules.',
    explanation: 'Deduction is governed by precise rules: auto usually drops top-level const and references unless they are written, while decltype can preserve an expression’s value category. nullptr participates only in pointer conversion, enum class keeps names and conversions scoped, and structured bindings bind names either by value or by reference according to the declaration. These features are safest when they make the real type relationship clearer, not when they hide ownership.',
    prediction: 'If value is an int lvalue, what types are produced by auto copy = value, auto& alias = value, decltype(value), and decltype((value))?',
    steps: [
      'Start from the initializer expression’s type, constness, and value category.',
      'Apply the deduction rule for auto, auto&, auto&&, or decltype rather than guessing from syntax.',
      'Choose scoped and type-safe forms such as nullptr and enum class at API boundaries.',
      'Check whether a range loop or structured binding copies values or binds references before mutating or retaining them.',
    ],
    failure: 'Plain auto can accidentally copy an expensive object or drop a reference. auto&& in ordinary code and in deduction contexts follows different rules. A structured binding by value does not update the original aggregate. Returning a view or reference obtained inside a range loop can dangle after the source dies.',
    application: 'A telemetry decoder uses enum class for message kinds, nullptr for absent pointers, structured bindings for parse results, and const auto& in range loops so packets are not copied while their ownership remains visible.',
    example: 'Write one small program that proves which deduced declarations copy and which alias, then mutate only through the declarations that refer to the original object.',
    code: `#include <map>
#include <string>
#include <type_traits>

enum class State {
  idle,
  ready,
};

int main() {
  int value = 4;
  auto copy = value;
  auto& alias = value;
  decltype((value)) second_alias = value;

  std::map<int, std::string> labels{{1, "ready"}};
  for (const auto& [id, label] : labels) {
    alias += id + static_cast<int>(label.size());
  }

  static_assert(!std::is_reference_v<decltype(copy)>);
  static_assert(std::is_lvalue_reference_v<decltype(alias)>);
  static_assert(std::is_lvalue_reference_v<decltype(second_alias)>);
  return value == 10 ? 0 : 1;
}`,
  }),

  'cpp-encapsulation': profile({
    definition: 'Encapsulation places state and the operations that preserve its invariant behind a deliberate class interface. Public members express what callers may do, private members hide representation, and protected members expose selected behavior to derived classes. Getters and setters are useful only when they represent valid domain queries and checked transitions.',
    explanation: 'Data hiding is not secrecy for its own sake. It prevents callers from creating states the class cannot support and lets the representation change without rewriting users. A setter must validate before committing, while a getter should avoid returning a mutable reference that bypasses the invariant. Protected mutable data weakens encapsulation because every derived type becomes coupled to the base representation.',
    prediction: 'If a Temperature class must remain between absolute zero and a sensor limit, what becomes impossible when callers can write its raw value directly?',
    steps: [
      'Write the invariant in one sentence before choosing access specifiers.',
      'Keep representation private and expose operations named after valid domain actions.',
      'Validate a requested state change before replacing the old valid state.',
      'Return values or read-only views when mutable access would bypass the invariant.',
    ],
    failure: 'Mechanical getters and setters for every field reproduce a public struct with extra syntax. Returning a non-const reference from a getter lets callers violate validation later. Protected data makes base-layout changes ripple through derived classes. A friend declaration grants full private access and should remain narrow.',
    application: 'A serial configuration class keeps baud rate, parity, and stop bits private. Its constructor and reconfigure operation reject combinations the hardware cannot generate, while queries expose the committed settings to the driver.',
    example: 'Attempt to set an invalid baud rate through the public API and prove that the previous valid configuration remains unchanged.',
    code: `#include <optional>

class SerialConfig {
 public:
  static std::optional<SerialConfig> create(unsigned baud) {
    if (baud < 1'200 || baud > 3'000'000) {
      return std::nullopt;
    }
    return SerialConfig(baud);
  }

  unsigned baud_rate() const {
    return baud_rate_;
  }

  bool set_baud_rate(unsigned baud) {
    if (baud < 1'200 || baud > 3'000'000) {
      return false;
    }
    baud_rate_ = baud;
    return true;
  }

 private:
  explicit SerialConfig(unsigned baud) : baud_rate_(baud) {}
  unsigned baud_rate_;
};`,
  }),

  'cpp-operators': profile({
    definition: 'Operator overloading defines how an existing C++ operator acts on a user-defined type. It cannot invent operators or change precedence, associativity, or operand count. A sound overload preserves the operator’s familiar meaning and the type’s invariant.',
    explanation: 'Member operators naturally own operations whose left operand must be the class, such as operator[] and assignment. Symmetric arithmetic and comparison operators are often non-members so conversions can apply equally to both operands. Compound assignment can implement the mutation once, while a non-mutating binary operator works on a copy and delegates to it. Comparison must form a coherent relation because sorting and ordered containers rely on those laws.',
    prediction: 'Why is Duration operator+(Duration, Duration) often better as a non-member while Duration::operator+= belongs as a member?',
    steps: [
      'State the mathematical or domain law the operator is expected to preserve.',
      'Choose member or non-member form based on symmetry, required access, and conversion behavior.',
      'Implement one primitive operation and derive related operators without duplicating mutation logic.',
      'Test identity, ordering, chaining, const operands, and boundary behavior.',
    ],
    failure: 'Overloading && or || loses normal short-circuit expectations. Returning a reference to a local result dangles. An ordering relation that is not transitive makes sorting behavior invalid. Surprising side effects in arithmetic operators make otherwise readable expressions unsafe.',
    application: 'A firmware Duration type overloads arithmetic and comparison so timeout calculations retain units and cannot be accidentally mixed with raw register counts.',
    example: 'Implement += and derive + from it, then verify that left + right does not mutate either input and comparisons agree with stored microseconds.',
    code: `#include <compare>
#include <cstdint>

class Duration {
 public:
  explicit constexpr Duration(std::int64_t microseconds)
      : microseconds_(microseconds) {}

  constexpr Duration& operator+=(Duration other) {
    microseconds_ += other.microseconds_;
    return *this;
  }

  constexpr auto operator<=>(const Duration&) const = default;

 private:
  std::int64_t microseconds_;
};

constexpr Duration operator+(Duration left, Duration right) {
  left += right;
  return left;
}

static_assert(Duration{2} + Duration{3} == Duration{5});`,
  }),

  'cpp-inheritance': profile({
    definition: 'Inheritance creates a derived type containing a base-class subobject. Public inheritance promises that the derived object can satisfy the base interface. A diamond occurs when two inheritance paths reach the same base; virtual inheritance can make those paths share one base subobject.',
    explanation: 'Construction begins with virtual bases, then direct bases, then members. Without virtual inheritance, the final diamond object contains one base subobject per path, so converting to that base can be ambiguous. With virtual inheritance, the most-derived constructor is responsible for the shared virtual base. Inheritance should model substitutability; reusable implementation alone is usually better expressed with composition.',
    prediction: 'If Left and Right both inherit Component normally and Device inherits both, how many Component subobjects does Device contain and why is a direct Component conversion ambiguous?',
    steps: [
      'Identify the base contract and ask whether every derived value can obey it.',
      'Draw every base subobject reached through the inheritance graph.',
      'Use virtual inheritance only when one shared base identity is required across a diamond.',
      'Trace construction from virtual base to direct bases to members, and destruction in reverse.',
    ],
    failure: 'Public inheritance without substitutability breaks callers that rely on the base contract. A non-virtual diamond duplicates base state and produces ambiguous access. Virtual inheritance changes layout and construction responsibility. Protected mutable data makes every derived type depend on base representation.',
    application: 'A hardware abstraction may use one abstract Peripheral interface and several concrete drivers. If separate diagnostic and power-aware interfaces share one common Device identity, the diamond must be designed deliberately rather than discovered through ambiguous state.',
    example: 'Construct one non-virtual diamond and inspect the two base addresses, then switch both intermediate bases to virtual inheritance and confirm that the final object has one shared base.',
    code: `#include <cassert>

struct Component {
  explicit Component(int identifier) : id(identifier) {}
  int id;
};

struct Powered : virtual Component {
  Powered() : Component(0) {}
};

struct Diagnosed : virtual Component {
  Diagnosed() : Component(0) {}
};

struct Device : Powered, Diagnosed {
  explicit Device(int identifier) : Component(identifier) {}
};

int main() {
  Device device{7};
  Component* through_power = static_cast<Powered*>(&device);
  Component* through_diagnostics = static_cast<Diagnosed*>(&device);
  assert(through_power == through_diagnostics);
}`,
  }),

  'cpp-exceptions': profile({
    definition: 'Exception handling transfers control from a throw expression to the nearest matching catch handler. While control searches outward, stack unwinding destroys every fully constructed automatic object in exited scopes. noexcept states that no exception may escape a function; violation terminates the program.',
    explanation: 'A try block protects operations whose failures are handled at its boundary. Catch handlers are checked in order, so derived or specific exception types belong before broad base types, and catch (...) matches anything only when the boundary can safely translate, record, or terminate. Exception safety comes from invariants and RAII: the basic guarantee preserves validity, the strong guarantee commits nothing on failure, and the no-throw guarantee is required for cleanup operations.',
    prediction: 'If a constructor acquires a file and a later member constructor throws, which destructors run and why does the incomplete object’s destructor not run?',
    steps: [
      'Define the normal postcondition and decide which failures cannot satisfy it.',
      'Acquire every resource into an RAII owner before a later operation can throw.',
      'Catch only where the program can recover, add context, or translate the error meaningfully.',
      'Choose and test the basic, strong, or no-throw guarantee for each public operation.',
    ],
    failure: 'Catching by value can slice a derived exception. Placing catch(std::exception) before a derived handler makes the derived handler unreachable. Throwing from a destructor during unwinding calls terminate. A catch-all that silently continues hides broken invariants. Marking a function noexcept without ensuring the contract turns an ordinary failure into termination.',
    application: 'A configuration loader uses RAII for files and temporary state, throws a typed parse error when it cannot produce a valid configuration, and catches only at the command boundary where line information can be printed.',
    example: 'Throw a ParseError while two trace objects are alive, observe reverse destruction during unwinding, and compare the typed handler with the final catch-all boundary.',
    code: `#include <exception>
#include <iostream>
#include <stdexcept>
#include <string>

class ParseError : public std::runtime_error {
 public:
  using std::runtime_error::runtime_error;
};

struct Trace {
  std::string name;
  ~Trace() noexcept {
    std::cout << "destroy " << name << '\\n';
  }
};

void parse(bool valid) {
  Trace file{"file"};
  Trace buffer{"buffer"};
  if (!valid) {
    throw ParseError{"invalid configuration"};
  }
}

int main() {
  try {
    parse(false);
  } catch (const ParseError& error) {
    std::cerr << "parse: " << error.what() << '\\n';
  } catch (const std::exception& error) {
    std::cerr << "standard: " << error.what() << '\\n';
  } catch (...) {
    std::cerr << "unknown failure\\n";
  }
}`,
  }),

  'cpp-template-specialization': profile({
    definition: 'Template specialization replaces or refines a primary template for selected arguments. Full specialization targets one exact argument list, partial specialization matches a family of class or variable template arguments, and variadic templates accept parameter packs of arbitrary length. Explicit instantiation controls where a specialization is generated.',
    explanation: 'The compiler first selects a primary template and then chooses the most specialized matching partial or full specialization under formal ordering rules. Function templates may be fully specialized but not partially specialized; overloading is normally the better function mechanism. Parameter packs are expanded deliberately, often with fold expressions. Explicit instantiation can reduce build duplication when a known set of concrete types is supported.',
    prediction: 'For Storage<int*>, why can a class-template partial specialization for T* be selected while an equivalent partial specialization of a function template is forbidden?',
    steps: [
      'Write the primary template contract that works for the general case.',
      'Identify an exact type or type pattern whose representation or operation genuinely differs.',
      'Use full or partial class specialization and confirm which definition is most specialized.',
      'For packs, define the empty case and expansion order; for explicit instantiation, choose one owning translation unit.',
    ],
    failure: 'Overlapping partial specializations can be ambiguous. A specialization that changes the public contract makes generic callers unreliable. Pack expansion without a base identity fails for an empty pack. Explicit instantiation before a complete definition or for unsupported operations produces build failures far from the call.',
    application: 'A binary serializer uses a primary template for fixed-width values, a partial specialization for arrays, and a variadic record encoder that serializes each field in order.',
    example: 'Instantiate Storage<int>, Storage<int*>, and one exact Storage<bool> specialization, then verify which definition each object selects.',
    code: `#include <cstddef>

template <class T>
struct Storage {
  static constexpr const char* kind = "value";
};

template <class T>
struct Storage<T*> {
  static constexpr const char* kind = "pointer";
};

template <>
struct Storage<bool> {
  static constexpr const char* kind = "bit";
};

template <class... Values>
constexpr auto sum(Values... values) {
  return (0 + ... + values);
}

static_assert(Storage<int>::kind[0] == 'v');
static_assert(Storage<int*>::kind[0] == 'p');
static_assert(Storage<bool>::kind[0] == 'b');
static_assert(sum(1, 2, 3, 4) == 10);`,
  }),

  'cpp-lambdas': profile({
    definition: 'A lambda expression creates an unnamed function object. Its capture list stores copies or references to surrounding state, its parameters define each call, and a generic lambda uses auto parameters to generate a templated call operator. Lambdas integrate local behavior with standard algorithms without creating global helper functions.',
    explanation: 'Capture determines lifetime. A value capture belongs to the closure object and remains usable if the original local disappears; a reference capture aliases the original and dangles if a deferred callback outlives it. mutable permits changing captured copies, not the originals. Generic lambdas are ordinary closure types with a templated call operator, and algorithm calls may copy that closure.',
    prediction: 'Which capture is safe when a callback is stored and invoked after the function that created it returns: a local threshold by value or by reference?',
    steps: [
      'Write the callable’s input and output before choosing captures.',
      'Capture owned small values by value and synchronous shared state by a reference whose lifetime is proven.',
      'Use explicit captures instead of broad defaults when ownership matters.',
      'Pass the closure to an algorithm and verify whether the algorithm copies it or invokes it later.',
    ],
    failure: 'Returning a lambda that captured a local by reference creates a dangling callback. [=] can silently copy a large owner, while [&] can silently retain unsafe aliases. A mutable value capture changes only the closure’s copy. Capturing this does not automatically extend the object’s lifetime.',
    application: 'A sample-processing pipeline uses a value-captured calibration offset in std::ranges::transform and a generic lambda to validate several numeric sample types without exposing global mutable state.',
    example: 'Create one stored callback with a value capture and one synchronous algorithm predicate with a reference capture, then state the lifetime proof for each.',
    code: `#include <algorithm>
#include <vector>

std::vector<int> calibrate(std::vector<int> samples, int offset) {
  std::ranges::transform(
      samples,
      samples.begin(),
      [offset](auto value) {
        return value - offset;
      });
  return samples;
}

int count_positive(const std::vector<int>& values) {
  int calls = 0;
  const auto count = std::ranges::count_if(values, [&calls](int value) {
    ++calls;
    return value > 0;
  });
  return static_cast<int>(count);
}`,
  }),

  'cpp-errors': profile({
    definition: 'Type-safe utility types represent absence, alternatives, open-ended values, and value-or-error results without unchecked sentinels or void pointers. optional stores zero or one value, variant stores one alternative from a closed list, any stores one runtime-typed copyable value, and expected stores either a value or typed error.',
    explanation: 'Choose from the shape of the state. optional fits ordinary absence with no additional reason. variant fits a closed set of valid alternatives and std::visit dispatches by active type. any fits an open set only when runtime type erasure is truly required. expected fits routine failure that callers are expected to inspect. Each type makes access conditional, so unchecked extraction remains a design error.',
    prediction: 'Should a parser that returns either a Reading, Timeout, or Disconnected state use optional, variant, any, or expected, and which distinction controls the choice?',
    steps: [
      'List every legitimate result state and decide whether the set is open or closed.',
      'Choose optional for absence, variant for closed alternatives, any for open runtime types, or expected for value versus error.',
      'Check the active state before access or centralize handling with std::visit.',
      'Translate low-level errors into a typed domain value before returning across the API boundary.',
    ],
    failure: 'Calling optional::value on absence or get with the wrong variant alternative throws. A visitor that handles only today’s alternatives breaks when the variant grows. any discards compile-time exhaustiveness and can spread runtime type errors. expected becomes noisy when failure is truly exceptional and normally propagated.',
    application: 'A sensor API returns variant<Reading, Timeout, Disconnected> because all three are normal closed outcomes, while a configuration lookup returns optional<Value> and a parser returns expected<Config, ParseError>.',
    example: 'Visit every alternative of a sensor result and make the compiler reject the visitor after adding an unhandled result type.',
    code: `#include <iostream>
#include <type_traits>
#include <variant>

struct Reading {
  double value;
};

struct Timeout {};
struct Disconnected {};

using Result = std::variant<Reading, Timeout, Disconnected>;

void report(const Result& result) {
  std::visit([](const auto& value) {
    using T = std::decay_t<decltype(value)>;
    if constexpr (std::is_same_v<T, Reading>) {
      std::cout << value.value << '\\n';
    } else if constexpr (std::is_same_v<T, Timeout>) {
      std::cout << "timeout\\n";
    } else {
      std::cout << "disconnected\\n";
    }
  }, result);
}`,
    standard: 'C++23',
  }),

  'cpp-testing': profile({
    definition: 'Testing modern C++ combines executable behavior checks with compiler diagnostics and runtime instrumentation. Unit and integration tests verify intended results; warnings, sanitizers, static analysis, leak detection, and race detection expose violations that ordinary output assertions may miss.',
    explanation: 'A useful test names an observable contract and controls the inputs needed to reproduce it. Ownership, lifetime, iterator, and concurrency bugs often require AddressSanitizer, UndefinedBehaviorSanitizer, LeakSanitizer, or ThreadSanitizer because the wrong program can still print the expected value. Deterministic fixtures and saved seeds turn failures into regression tests.',
    prediction: 'If a test asserts the right returned value but AddressSanitizer reports use-after-free, did the test pass?',
    steps: [
      'State the behavior and lifetime boundary the test must prove.',
      'Build with strict warnings and the sanitizer appropriate to the suspected class of defect.',
      'Exercise normal, boundary, ownership-transfer, failure, and repeated-operation paths.',
      'Keep the smallest reproducer and run it in the regular test suite after the fix.',
    ],
    failure: 'Tests that inspect only final values miss leaks, races, and invalid intermediate access. Nondeterministic time sleeps produce flaky concurrency tests. A fixture that shares mutable state between cases makes order affect results. Disabling a sanitizer finding because output looks right preserves undefined behavior.',
    application: 'A move-only buffer is tested for transfer, empty moved-from state, destruction, self-independent copies where allowed, and allocation failure under sanitizers before it enters a device pipeline.',
    example: 'Run one ownership regression with AddressSanitizer and UndefinedBehaviorSanitizer, then intentionally introduce a dangling access to prove the instrumentation is active.',
    code: `#include <cassert>
#include <memory>
#include <utility>

void test_unique_transfer() {
  auto source = std::make_unique<int>(42);
  auto destination = std::move(source);

  assert(source == nullptr);
  assert(destination != nullptr);
  assert(*destination == 42);
}

int main() {
  test_unique_transfer();
}`,
  }),

  'cpp-concurrency': profile({
    definition: 'C++ concurrency lets several threads execute within one process and defines how their memory operations interact. A mutex gives exclusive ownership of a compound invariant, a condition variable blocks until a predicate may have changed, and an atomic performs indivisible operations with an explicit memory-order contract.',
    explanation: 'Thread interleaving is not the central difficulty; visibility and ownership are. A data race occurs when conflicting accesses to one memory location are not ordered by synchronization and at least one is a write, making the program undefined. Mutex unlock/lock and release/acquire atomics can establish happens-before relationships that publish prior writes.',
    prediction: 'If a producer writes a buffer and then performs a relaxed store to ready, what guarantees that a consumer observing ready also sees the buffer contents?',
    steps: [
      'Assign ownership for every shared object and write the multi-field invariant protected by each lock.',
      'Use a predicate loop around condition-variable waits because wakeups can be spurious or consumed by another thread.',
      'For atomic publication, write data before a release operation and read it after a matching acquire operation.',
      'Join threads before referenced state dies and verify the design with ThreadSanitizer and stress tests.',
    ],
    failure: 'A data race is undefined behavior, not merely a stale read. Locking only one field of a multi-field invariant leaves the invariant racy. Waiting once without rechecking the predicate fails on spurious wakeups. Detached threads can access dead stack objects. Relaxed atomics do not publish unrelated ordinary memory.',
    application: 'A telemetry service gives acquisition, parsing, and storage separate threads. A mutex protects each queue’s ownership invariant, condition variables sleep while queues are empty, and a release/acquire flag publishes shutdown state.',
    example: 'Trace one producer writing data, publishing ready with release, and one consumer loading ready with acquire before reading the data.',
    code: `#include <atomic>
#include <cassert>
#include <thread>

int payload = 0;
std::atomic<bool> ready = false;

int main() {
  std::thread producer([] {
    payload = 42;
    ready.store(true, std::memory_order_release);
  });

  std::thread consumer([] {
    while (!ready.load(std::memory_order_acquire)) {
      std::this_thread::yield();
    }
    assert(payload == 42);
  });

  producer.join();
  consumer.join();
}`,
  }),
};

export function cppProfileFor(topicId) {
  const result = cppLessonProfiles[topicId];
  if (!result) {
    throw new Error(`Missing authored C++ lesson profile: ${topicId}`);
  }
  return result;
}
