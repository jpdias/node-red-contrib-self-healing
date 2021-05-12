# compensate

A node to compensate missing values with a pre-defined strategy.

This node is used to prevent the disruption of the message flow by compensating missing values with the ones that are calculated based on previous messages.

## Properties

- name: string
  - name of node to be displayed in editor.
- message history: number
  - number of previous messages that the node uses in order to calculate the missing value.
- timeout: number (s)
  - time before a message is considered missing
- strategy: <min, max, last, mode, mean>
  - strategy the node will use to calculate the missing value.
- confidence formula
  - formula that provides a confidence level on the compensated values.
- Is Active?
  - Defines behaviour of compensate node as active or passive. If its disabled (unchecked) the compensate node will only trigger a compensated value if it recieves a message with the "trigger" key.</dd>

### confidence formula

Confidence does an eval of a valid JS expression. Both compensated values counter (\_compensatedCounter) and history values (\_history) can be used.

Example: `(1 / _compensatedCounter) >= 1 ? 1 : (1 / _compensatedCounter)`

## Inputs

Any input in which the payload is a number

## Outputs

If a new message arrives at the node before the designed timeout, the node will output that message.

If not, it will output the value calculated through the defined strategy.
