import { qualcommPrepProfilesC } from './qualcommPrepProfilesC.js';
import { qualcommPrepProfilesDsa } from './qualcommPrepProfilesDsa.js';
import { qualcommPrepProfilesEmbedded } from './qualcommPrepProfilesEmbedded.js';
import { qualcommPrepProfilesInterview } from './qualcommPrepProfilesInterview.js';
import { qualcommPrepProfilesLinux } from './qualcommPrepProfilesLinux.js';
import { qualcommPrepTopics } from './qualcommPrepTopics.js';

export const qualcommPrepProfiles = {
  ...qualcommPrepProfilesC,
  ...qualcommPrepProfilesDsa,
  ...qualcommPrepProfilesLinux,
  ...qualcommPrepProfilesEmbedded,
  ...qualcommPrepProfilesInterview,
};

const topicIds = new Set(qualcommPrepTopics.map((topic) => topic.id));
const profileIds = Object.keys(qualcommPrepProfiles);
const missingProfiles = qualcommPrepTopics
  .filter((topic) => !qualcommPrepProfiles[topic.id])
  .map((topic) => topic.id);
const unknownProfiles = profileIds.filter((id) => !topicIds.has(id));

if (missingProfiles.length || unknownProfiles.length) {
  throw new Error([
    missingProfiles.length ? `Missing Qualcomm profiles: ${missingProfiles.join(', ')}` : '',
    unknownProfiles.length ? `Unknown Qualcomm profiles: ${unknownProfiles.join(', ')}` : '',
  ].filter(Boolean).join(' | '));
}

export const qualcommPrepProfileFor = (topicId) => qualcommPrepProfiles[topicId] ?? null;
