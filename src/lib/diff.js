/**
 * Compares two maps of files. Returns a new immutable map containing only the
 * changes that need to be applied to `input` to get to `output`. This can
 * include `null` values indicating 'deletions' (for keys that are present in
 * the input map but not the output map).
 */

import Immutable from 'immutable';

import normalize from './normalize';

export default function diff(_input, _output) {
  const input = normalize(_input);
  const output = normalize(_output);

  const inputKeys = Immutable.Set.fromKeys(input);
  const outputKeys = Immutable.Set.fromKeys(output);

  const changes = {};

  // include any output files that are newly created/modified
  for (const outputKey of outputKeys) {
    const outputValue = output.get(outputKey);
    const inputValue = input.get(outputKey);

    if (!inputValue || !outputValue.equals(inputValue)) {
      changes[outputKey] = outputValue;
    }
  }

  // add nulls for anything that has been deleted
  for (const inputKey of inputKeys) {
    if (!output.has(inputKey)) changes[inputKey] = null;
  }

  return Immutable.Map(changes);
}
