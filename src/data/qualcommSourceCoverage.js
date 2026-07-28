const source = (path, sha256, topics, visualAssets = 0, duplicateOf = null) => ({
  path,
  sha256,
  topics,
  visualAssets,
  duplicateOf,
});

const cCore = [
  'qualcomm-c-output-semantics',
  'qualcomm-c-storage-lifetime',
  'qualcomm-c-pointers-arrays',
  'qualcomm-c-aggregate-layout',
];
const cProgramming = [
  'qualcomm-c-bits-endian',
  'qualcomm-c-safe-arithmetic',
  'qualcomm-c-strings-files',
];
const dsaCore = [
  'qualcomm-dsa-complexity-search',
  'qualcomm-dsa-linked-lists',
  'qualcomm-dsa-fast-slow',
  'qualcomm-dsa-stack-queue',
  'qualcomm-dsa-hashing-distinct',
];
const linuxCore = [
  'qualcomm-linux-processes-signals',
  'qualcomm-linux-kernel-vm',
  'qualcomm-linux-synchronization',
  'qualcomm-linux-ipc',
  'qualcomm-linux-boot-linking',
];
const embeddedCore = [
  'qualcomm-arch-isa-cpu',
  'qualcomm-arch-memory-digital',
  'qualcomm-embedded-rtos-interrupts',
  'qualcomm-embedded-buses',
  'qualcomm-embedded-mcu-memory',
];

// This is a provenance ledger, not a list of imported assets. Every downloaded
// source remains listed once, including byte-identical duplicates, so a test can
// prove that no file silently disappeared during curriculum authoring.
export const qualcommSourceCoverage = [
  source(
    'C MCQ- Qualcomm.docx',
    '0c3a1a7283a5e45be0344d08f2829ed22b80511fd81e105daa1537ea811d77ac',
    [...cCore, 'qualcomm-c-safe-arithmetic'],
    8,
  ),
  source(
    'C Programming- Qualcomm.docx',
    '4fe6f5631277a1a2ebb0f4c866463c2495750c0543fac4df53dfa983fe4a6e4c',
    [...cProgramming, 'qualcomm-dsa-hashing-distinct'],
    1,
  ),
  source(
    'C Subjective- Qualcomm.docx',
    'fd0fe11baa5bf6db65fa40711bd6e2243c6e6a4134b60cd4f7c44f95c9689a3d',
    [...cCore, 'qualcomm-c-macros-build', 'qualcomm-c-bits-endian', 'qualcomm-c-strings-files'],
    1,
  ),
  source(
    'Copy of Copy of pattern_num_1_12_124.c',
    '23df3bce592892f550750e5266d9537c5ada16173b614610e875406c0015c0a8',
    ['qualcomm-c-strings-files'],
    0,
    'pattern_num_1_12_124.c',
  ),
  source(
    'Copy of pattern_num_1_12_124.c',
    '23df3bce592892f550750e5266d9537c5ada16173b614610e875406c0015c0a8',
    ['qualcomm-c-strings-files'],
    0,
    'pattern_num_1_12_124.c',
  ),
  source(
    'DS Programming- Qualcomm.docx',
    'e2c17b0bd51403e334ab3cf6713afcdb28891589261f2abdc5a17dbfbcbf24f0',
    dsaCore,
  ),
  source(
    'DS Subjective- Qualcomm.docx',
    '0c3633de7c030c496d6de8e86fa3b8cb5cfab1738665254798b42d94f6728169',
    [...dsaCore, 'qualcomm-dsa-trees-convolution', 'qualcomm-c-macros-build'],
  ),
  source(
    'LI Subjective- Qualcomm.docx',
    'b96be5bc54bbb24e37d21792307f9337aaa9f6cbb8843a03b8ecd57d480d6fda',
    [...linuxCore, 'qualcomm-linux-thread-matrix', 'qualcomm-embedded-rtos-interrupts'],
  ),
  source(
    'LS Programming- Qualcomm.docx',
    '8a03dbfdf35d35a0acc71bf7043f9472f77eff9a84a48d39e9b301b63511c493',
    ['qualcomm-linux-shell-tools', 'qualcomm-linux-shell-programs'],
  ),
  source(
    'LS Subjective- Qualcomm.docx',
    '92cdd5c176cd59365eac1cddde2b07e11533e1077bcb293aceab47411a2533cf',
    ['qualcomm-linux-shell-tools', 'qualcomm-linux-shell-programs'],
  ),
  source(
    'MC Subjective- Qualcomm.docx',
    'cfa18b6e86dcf047ebe2e5d59ed777164fa3f6805ca6bfbce8beda79cd21443c',
    [...embeddedCore, 'qualcomm-embedded-uart'],
  ),
  source(
    'Other Questions- Qualcomm.docx',
    'ad1524d2dc8777d389ec66cb5b44c499f1d32ece20feadc4128eee2d19dcb124',
    [
      'qualcomm-embedded-feedback',
      'qualcomm-testing-devices',
      'qualcomm-puzzles-measurement',
      'qualcomm-puzzles-cubes-cuts',
      'qualcomm-puzzles-balance-motion',
      'qualcomm-puzzles-logic',
      'qualcomm-puzzles-math-signals',
    ],
    1,
  ),
  source(
    'pattern_num_1_12_124.c',
    '23df3bce592892f550750e5266d9537c5ada16173b614610e875406c0015c0a8',
    ['qualcomm-c-strings-files'],
  ),
  source(
    'print_pattern_1_12_123.c',
    'bf1a8cd77a29c172789740e061fd5b37308c9d7256b78420a51bc9248114302d',
    ['qualcomm-c-strings-files'],
  ),
  source(
    'qualcom 21 nov.jpg',
    '537d89e0e6989242a97bb3094bc0dcd1af7513f1652f28c2bb4108a7a5d3a707',
    ['qualcomm-c-bits-endian', 'qualcomm-c-aggregate-layout', 'qualcomm-project-explanation'],
    1,
  ),
  source(
    'Qualcom interview questions15-122021.jpeg',
    '37e002dbf2c822ec69f4190ed3bb808c8f24b9865493a466481b11ef87f834da',
    ['qualcomm-problem-bitwise-recurrence'],
    1,
  ),
  source(
    'Qualcom interview questions15122021.jpeg',
    'c132092ac5930ccc1621ca6f923facefb16010a77c3a4f6b0d69d7f5075b5006',
    ['qualcomm-dsa-hashing-distinct'],
    1,
  ),
  source(
    'Qualcomm 10122021.docx',
    '90b1a7dc1fd665df8b0d9b58e88dbc87cbdf02b409c86f9ca52730203b49eef4',
    [
      'qualcomm-dsa-hashing-distinct',
      'qualcomm-dsa-trees-convolution',
      'qualcomm-problem-bitwise-recurrence',
      'qualcomm-problem-clarification',
    ],
  ),
  source(
    'Qualcomm 10122021.odt',
    '7d545460b841a4471e468e1dbd754575642bb1f5f90475e6ffd492b052d92aae',
    [
      'qualcomm-dsa-hashing-distinct',
      'qualcomm-dsa-trees-convolution',
      'qualcomm-problem-bitwise-recurrence',
      'qualcomm-problem-clarification',
    ],
  ),
  source(
    'Qualcomm _26052021.odt',
    '30966b7986884ab38c265ffdc540dbc28f412b7728c13302d556023b5572c48d',
    ['qualcomm-linux-processes-signals', 'qualcomm-arch-isa-cpu'],
  ),
  source(
    'Qualcomm Interview Question Solutions.docx',
    '27934cf52bea84844023dabf50ae8bee42b35e968eb1988245c87a498b7f04b1',
    [
      ...cProgramming,
      'qualcomm-c-macros-build',
      'qualcomm-arch-isa-cpu',
      'qualcomm-puzzles-cubes-cuts',
    ],
    4,
  ),
  source(
    'Qualcomm Interview Question_.pdf',
    '9a335b009da8ce9c73560f22ce947963b4a1cb2edc8e2e05a1bec4be9a9f47b8',
    [...cCore, 'qualcomm-project-explanation'],
  ),
  source(
    'Qualcomm Interview Questions 17-12-2021.docx',
    'cd32095b823bfe9eb24df002e5fe713b54fb62094ca74081a245f085cb2c20a9',
    [
      ...cCore,
      'qualcomm-c-safe-arithmetic',
      'qualcomm-embedded-rtos-interrupts',
      'qualcomm-project-explanation',
      'qualcomm-behavioral-rounds',
    ],
  ),
  source(
    'QUALCOMM Questions.2.docx',
    '5257cc15ec477b82a7dcf7dd8e11babbf4cc2283ba3a6e31aa24d63411bdee7a',
    [
      'qualcomm-arch-isa-cpu',
      'qualcomm-c-storage-lifetime',
      'qualcomm-c-pointers-arrays',
      'qualcomm-dsa-linked-lists',
      'qualcomm-dsa-complexity-search',
      'qualcomm-dsa-hashing-distinct',
      'qualcomm-puzzles-cubes-cuts',
      'qualcomm-puzzles-measurement',
    ],
  ),
  source(
    'QUALCOMM QUESTIONS.docx',
    'd2854f78e5fd8ce6728491791ade1b21a569c87fcce8e5440e70629c175adeef',
    [
      'qualcomm-c-safe-arithmetic',
      'qualcomm-c-bits-endian',
      'qualcomm-c-storage-lifetime',
      'qualcomm-c-pointers-arrays',
      'qualcomm-dsa-fast-slow',
      'qualcomm-dsa-complexity-search',
      'qualcomm-embedded-buses',
      'qualcomm-arch-isa-cpu',
      'qualcomm-puzzles-logic',
    ],
  ),
  source(
    'Qualcomm-1.jpg',
    'a72b350bb41f918f488eb9a8d24f85d0cb234fb9c6219520a4a3032ed24f609a',
    [
      'qualcomm-c-strings-files',
      'qualcomm-c-safe-arithmetic',
      'qualcomm-c-storage-lifetime',
      'qualcomm-project-explanation',
      'qualcomm-embedded-rtos-interrupts',
      'qualcomm-puzzles-balance-motion',
    ],
    1,
  ),
  source(
    'Qualcomm-2.jpg',
    '42a107ac8baabaefd906c44c0a125634999fafc77c9cb54a9a091fcdae6c0c34',
    ['qualcomm-embedded-rtos-interrupts'],
    1,
  ),
  source(
    'Qualcomm-3.jpg',
    '71941c581b5539a141da0f062ea738229095da4cd0477044e626c43f9d3323c0',
    [
      'qualcomm-c-aggregate-layout',
      'qualcomm-c-safe-arithmetic',
      'qualcomm-linux-synchronization',
      'qualcomm-embedded-system-design',
      'qualcomm-puzzles-cubes-cuts',
      'qualcomm-puzzles-measurement',
    ],
    1,
  ),
  source(
    'qualcomm.jpg',
    'a0d458924be6ffb6e5a35ac1e69b7be304bbdeb27bfe1fa6a75709a10954fc07',
    [
      ...cCore,
      ...dsaCore,
      'qualcomm-linux-processes-signals',
      'qualcomm-linux-boot-linking',
      'qualcomm-puzzles-cubes-cuts',
    ],
    1,
  ),
  source(
    'Qualcomm.pdf',
    'caded7da249c34a493d09324366cf1e32526c3f87637c7349c0eec3f0002fc89',
    [
      'qualcomm-c-bits-endian',
      'qualcomm-c-storage-lifetime',
      'qualcomm-c-macros-build',
      'qualcomm-dsa-linked-lists',
      'qualcomm-linux-processes-signals',
      'qualcomm-linux-boot-linking',
      'qualcomm-arch-memory-digital',
      'qualcomm-embedded-system-design',
      'qualcomm-project-explanation',
    ],
  ),
  source(
    'Qualcomm1.pdf',
    'e86d30eb2dc2917081c3002553b00deda7cc8c17e4c23088a5f3a20c1bcc0a82',
    [
      'qualcomm-c-strings-files',
      'qualcomm-dsa-linked-lists',
      'qualcomm-dsa-stack-queue',
      'qualcomm-linux-synchronization',
      'qualcomm-linux-ipc',
      'qualcomm-embedded-buses',
      'qualcomm-project-explanation',
    ],
  ),
  source(
    'Qualcomm2.jpg',
    '72f04fbce166356bc6f8ca670a7051711ebb52e9e2786a2cf89585b52bb26335',
    [
      'qualcomm-embedded-feedback',
      'qualcomm-linux-shell-tools',
      'qualcomm-puzzles-logic',
      'qualcomm-puzzles-balance-motion',
    ],
    1,
  ),
  source(
    'Qualcomm3.jpg',
    '4192067ae7d9c0993b2939fc402ed195a8c9b4d5c83c8d9fbff61a9007899597',
    [
      ...cCore,
      ...dsaCore,
      'qualcomm-embedded-mcu-memory',
      'qualcomm-puzzles-cubes-cuts',
    ],
    1,
  ),
  source(
    'Qualcomm_interview_questions.docx',
    'c3b162ef4737ea9531d4b30b43da0eb7662a3076c63923f47a38012975a52f1e',
    [...cCore, 'qualcomm-c-safe-arithmetic'],
    9,
  ),
  source(
    'qualcomm_tech_HR_rounds_june_2020 (1).docx',
    '11eb2ae0b5ba70717fe577d5e90955c7fc8766feaee9eb77bcf547dec3176ad6',
    [
      'qualcomm-behavioral-rounds',
      'qualcomm-testing-devices',
      'qualcomm-c-pointers-arrays',
      'qualcomm-project-explanation',
    ],
    0,
    'qualcomm_tech_HR_rounds_june_2020.docx',
  ),
  source(
    'qualcomm_tech_HR_rounds_june_2020.docx',
    '11eb2ae0b5ba70717fe577d5e90955c7fc8766feaee9eb77bcf547dec3176ad6',
    [
      'qualcomm-behavioral-rounds',
      'qualcomm-testing-devices',
      'qualcomm-c-pointers-arrays',
      'qualcomm-project-explanation',
    ],
  ),
  source(
    'reverse_string.c',
    '775241b29ad7e8727a99ce274a4616e427df5a45fc04599c06ae007b87ea10d3',
    ['qualcomm-c-strings-files'],
  ),
  source(
    'technical round - Aug 2022.docx',
    '52247e39409f9319d1b985b132efcef73c53c9bbf9bbbcd6a453c358969d2ba5',
    [
      ...cCore,
      ...dsaCore,
      'qualcomm-linux-processes-signals',
      'qualcomm-linux-synchronization',
      'qualcomm-embedded-rtos-interrupts',
      'qualcomm-embedded-buses',
      'qualcomm-project-explanation',
      'qualcomm-behavioral-rounds',
      'qualcomm-puzzles-measurement',
      'qualcomm-puzzles-balance-motion',
    ],
  ),
  source(
    'WhatsApp Image 2022-07-28 at 9.27.42 AM.jpeg',
    'b0dfd00729830cc8ffce763673f6c1947cd20a73c4dff97ff43f0fcf12a5b9dd',
    ['qualcomm-problem-k-distinct-window'],
    1,
  ),
  source(
    'WhatsApp Image 2022-07-28 at 9.27.43 AM (1).jpeg',
    '435e5a11b2920b07c024485722df72d622d0c8250bb7c3db2530639c4adca1eb',
    ['qualcomm-problem-prefix-cost'],
    1,
  ),
  source(
    'WhatsApp Image 2022-07-28 at 9.27.43 AM.jpeg',
    '029c6c346eaa0fb2e6d388939050e1d3dd5c079a9344766fb1e3c54dd2834409',
    ['qualcomm-problem-palindrome-intervals'],
    1,
  ),
  source(
    'WhatsApp Image 2022-07-28 at 9.27.44 AM.jpeg',
    '4b273278bfd9e9454763b18b0ffa059e5a6fc10457cfdb55259a59462e4364b3',
    ['qualcomm-problem-dam-design'],
    1,
  ),
];

export const qualcommSourceAudit = {
  sourceFileCount: 42,
  filesWithExtractedText: 29,
  filesWithVisualMedia: 19,
  visualAssetCount: 37,
  extractionErrors: 0,
  duplicateGroups: [
    [
      'Copy of Copy of pattern_num_1_12_124.c',
      'Copy of pattern_num_1_12_124.c',
      'pattern_num_1_12_124.c',
    ],
    [
      'qualcomm_tech_HR_rounds_june_2020 (1).docx',
      'qualcomm_tech_HR_rounds_june_2020.docx',
    ],
  ],
};
