# Changelog

All notable changes to this project will be documented in this file.

## Sprint 2 (21/10/2020 - 10/11/2020)

### Week of 04/11/2020 - 10/11/2020

#### Added

- Added Checkpoint node #61
- Action Delay/Debounce: add tests for the following strategies: first, last and allByOder. Changed the name and functionality of action delay to debounce. #55 #18

#### Changed

- Enhancement of Timing Check node by adding a sliding window and determining the average of periods between
  consecutive messages, which allows achieving a more concise conclusion about the general flow. Sliding window
  size can be defined in the node's settings. #57
- Action Delay: refactor discard strategy test #55
- Enhancement of Replication Voter node by adding the possibility of using strings and using a margin when calculating the majority value.

### Week of 28/10/2020 - 03/11/2020

#### Added

- Readings Watcher: add a pair of buttons ("percentile" and "fixed") to the node's UI that functions as a switch.
  Based on which mode is selected, a "percentile" or "fixed" change is calculated and compare to the threshold
  values defined for minimum/maximum change.
  Also refactors the old tests and adds new ones for the "fixed" mode. #58
- Action Delay: added margin for the delay. #55

#### Changed

- Rebuilt pipelines to focus on merge requests and protected branches #53
- Refactored node Action Delay #55

### Week of 21/10/2020 - 27/10/2020

## Sprint 1 (07/10/2020 - 20/10/2020)

### Week of 13/10/2020 - 20/10/2020

#### Added

- Node Balancing #41
- Set up integration with upstream GitHub repository #44
- Code coverage analysis #46
- Mutation testing #47
- Unit tests for every node

#### Changed

- Refactored node Threshold Check #30
- Refactored node Heartbeat #29
- Refactored node Readings Watcher #32
- Refactored node Replication Voter #35
- Refactored node Flow Control #36
- Refactored node Kalman Noise Filter #38
- Refactored node Timing Check #33
- Refactored node Action Delay #31

#### Security

- SAST Integration #48

### Week of 06/10/2020 - 12/10/2020

#### Added

- Format checking pipeline job #43
- Unit testing pipeline job #42

## Sprint 0 (29/10/2020 - 06/10/2020)

### Week of 29/10/2020 - 06/10/2020

#### Added

- Cloned repository from PO
- README.md
- CHANGELOG.md
