import { get, set, unset } from 'lodash';
import {
  FieldValues,
  FieldArrayPath,
  UseFieldArrayProps,
  UseFieldArrayReturn,
  Control,
  FieldPath,
  RegisterOptions,
  FieldArrayWithId,
  FieldArray,
  FieldArrayMethodProps,
  FormState,
  FieldErrors,
  Field,
} from 'react-hook-form';
import { v4 as uuidV4 } from 'uuid';
import cloneObject from '../../utils/cloneObject';
import convertToArrayPayload from '../../utils/convertToArrayPayload';
import fillEmptyArray from '../../utils/fillEmptyArray';
import isEmptyObject from '../../utils/isEmptyObject';
import { appendAt } from '../../utils/append';
import updateFieldArrayRootError from '../../logic/updateFieldArrayRootError';
import validateField from '../../logic/validateField';
import getValidationModes from '../../logic/getValidationModes';
import isWatched from '../../logic/isWatched';
import getFocusFieldName from '../../logic/getFocusFieldName';
import insertAt from '../../utils/insert';
import moveArrayAt from '../../utils/move';
import prependAt from '../../utils/prepend';
import removeArrayAt from '../../utils/remove';
import swapArrayAt from '../../utils/swap';
import updateAt from '../../utils/update';
import { VALIDATION_MODE } from '../../constants';
import iterateFieldsByAction from '../../logic/iterateFieldsByAction';

type FieldObserver<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id'
> = (fields: FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[]) => void;

export type CreateArrayReturn<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id'
> = Omit<UseFieldArrayReturn<TFieldValues, TFieldArrayName, TKeyName>, '_fields'> & {
  cleanup: () => void;
  updateFormState: () => void;
  watchFields: (observer: FieldObserver<TFieldValues, TFieldArrayName, TKeyName>) => {
    unwatch: () => void;
  };
  logPrivateVars: () => void;
  // get actioned(): boolean;
  // get fields(): FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[];
  // get ids(): string[];

  // set actioned(value: boolean);
  // set fields(value: FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[]);
  // set ids(value: string[]);
};

export function createFieldArray<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id'
>(
  props: UseFieldArrayProps<TFieldValues, TFieldArrayName, TKeyName>
): CreateArrayReturn<TFieldValues, TFieldArrayName, TKeyName> {
  const { name, keyName = 'id', shouldUnregister } = props;
  const control = props.control as Control<TFieldValues>;
  let _ids = control._getFieldArray(name).map(() => uuidV4());

  let _actioned = false;
  let _observers = [] as FieldObserver<TFieldValues, TFieldArrayName, TKeyName>[];

  control._names.array.add(name);

  // if (props.rules) {
  //   (control as Control<TFieldValues>).register(
  //     name as FieldPath<TFieldValues>,
  //     props.rules as RegisterOptions<TFieldValues>
  //   );
  // }

  function updateValues<
    T extends Partial<FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>>[]
  >(updatedFieldArrayValues: T) {
    _actioned = true;
    control._updateFieldArray(name, updatedFieldArrayValues);

    const fields = updatedFieldArrayValues.map((field, index) => ({
      ...field,
      [keyName]: _ids[index] || uuidV4(),
    })) as FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[];

    _observers.forEach((observer) => {
      observer(fields);
    });
  }

  function append(
    value:
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>[],
    options?: FieldArrayMethodProps
  ) {
    const appendValue = convertToArrayPayload(cloneObject(value));
    const updatedFieldArrayValues = appendAt(control._getFieldArray(name), appendValue);
    control._names.focus = getFocusFieldName(name, updatedFieldArrayValues.length - 1, options);
    _ids = appendAt(
      _ids,
      appendValue.map(() => uuidV4())
    );
    updateValues(updatedFieldArrayValues);
    control._updateFieldArray(name, updatedFieldArrayValues, appendAt, {
      argA: fillEmptyArray(value),
    });
  }

  function prepend(
    value:
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>[],
    options?: FieldArrayMethodProps
  ) {
    const prependValue = convertToArrayPayload(cloneObject(value));
    const updatedFieldArrayValues = prependAt(control._getFieldArray(name), prependValue);
    control._names.focus = getFocusFieldName(name, 0, options);
    _ids = prependAt(
      _ids,
      prependValue.map(() => uuidV4())
    );
    updateValues(updatedFieldArrayValues);
    control._updateFieldArray(name, updatedFieldArrayValues, prependAt, {
      argA: fillEmptyArray(value),
    });
  }

  function remove(index?: number | number[]) {
    const updatedFieldArrayValues = removeArrayAt(control._getFieldArray(name), index);
    _ids = removeArrayAt(_ids, index);
    updateValues(updatedFieldArrayValues);
    control._updateFieldArray(name, updatedFieldArrayValues, removeArrayAt, {
      argA: index,
    });
  }

  function insert(
    index: number,
    value:
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>[],
    options?: FieldArrayMethodProps
  ) {
    const insertValue = convertToArrayPayload(cloneObject(value));
    const updatedFieldArrayValues = insertAt(control._getFieldArray(name), index, insertValue);
    control._names.focus = getFocusFieldName(name, index, options);
    _ids = insertAt(
      _ids,
      index,
      insertValue.map(() => uuidV4())
    );
    updateValues(updatedFieldArrayValues);
    control._updateFieldArray(name, updatedFieldArrayValues, insertAt, {
      argA: index,
      argB: fillEmptyArray(value),
    });
  }

  function swap(indexA: number, indexB: number) {
    const updatedFieldArrayValues = control._getFieldArray(name);
    swapArrayAt(updatedFieldArrayValues, indexA, indexB);
    swapArrayAt(_ids, indexA, indexB);
    updateValues(updatedFieldArrayValues);
    control._updateFieldArray(
      name,
      updatedFieldArrayValues,
      swapArrayAt,
      {
        argA: indexA,
        argB: indexB,
      },
      false
    );
  }

  function move(from: number, to: number) {
    const updatedFieldArrayValues = control._getFieldArray(name);
    moveArrayAt(updatedFieldArrayValues, from, to);
    moveArrayAt(_ids, from, to);
    updateValues(updatedFieldArrayValues);
    control._updateFieldArray(
      name,
      updatedFieldArrayValues,
      moveArrayAt,
      {
        argA: from,
        argB: to,
      },
      false
    );
  }

  function update(index: number, value: FieldArray<TFieldValues, TFieldArrayName>) {
    const updateValue = cloneObject(value);
    const updatedFieldArrayValues = updateAt(
      control._getFieldArray<FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>>(name),
      index,
      updateValue as FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>
    );
    _ids = [...updatedFieldArrayValues].map((item, i) =>
      !item || i === index ? uuidV4() : _ids[i]
    );
    updateValues([...updatedFieldArrayValues]);
    control._updateFieldArray(
      name,
      updatedFieldArrayValues,
      updateAt,
      {
        argA: index,
        argB: updateValue,
      },
      true,
      false
    );
  }

  function replace(
    value:
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>[]
  ) {
    const updatedFieldArrayValues = convertToArrayPayload(cloneObject(value));
    _ids = updatedFieldArrayValues.map(() => uuidV4());
    updateValues([...updatedFieldArrayValues]);
    control._updateFieldArray(
      name,
      [...updatedFieldArrayValues],
      <T>(data: T): T => data,
      {},
      true,
      false
    );
  }

  // This function would need to be called manually to update the form state
  function updateFormState() {
    control._state.action = false;

    if (isWatched(name, control._names)) {
      control._subjects.state.next({
        ...control._formState,
      } as FormState<TFieldValues>);
    }

    if (
      _actioned &&
      (!getValidationModes(control._options.mode).isOnSubmit || control._formState.isSubmitted)
    ) {
      if (control._options.resolver) {
        control._executeSchema([name]).then((result) => {
          const error = get(result.errors, name);
          const existingError = get(control._formState.errors, name);

          if (
            existingError
              ? (!error && existingError.type) ||
                (error &&
                  (existingError.type !== error.type || existingError.message !== error.message))
              : error && error.type
          ) {
            error
              ? set(control._formState.errors, name, error)
              : unset(control._formState.errors, name);
            control._subjects.state.next({
              errors: control._formState.errors as FieldErrors<TFieldValues>,
            });
          }
        });
      } else {
        const field: Field = get(control._fields, name) as Field;
        if (
          field &&
          field._f &&
          !(
            getValidationModes(control._options.reValidateMode).isOnSubmit &&
            getValidationModes(control._options.mode).isOnSubmit
          )
        ) {
          validateField(
            field,
            control._formValues,
            control._options.criteriaMode === VALIDATION_MODE.all,
            control._options.shouldUseNativeValidation,
            true
          ).then(
            (error) =>
              !isEmptyObject(error) &&
              control._subjects.state.next({
                errors: updateFieldArrayRootError(
                  control._formState.errors as FieldErrors<TFieldValues>,
                  error,
                  name
                ) as FieldErrors<TFieldValues>,
              })
          );
        }
      }
    }

    control._subjects.values.next({
      name,
      values: { ...control._formValues },
    });

    control._names.focus &&
      iterateFieldsByAction(control._fields, (ref, key: string) => {
        if (control._names.focus && key.startsWith(control._names.focus) && ref.focus) {
          ref.focus();
          return 1;
        }
        return;
      });
    control._names.focus = '';

    control._updateValid();
    _actioned = false;
  }

  // This would need to be called manually when the component unmounts
  function cleanup() {
    if (control._options.shouldUnregister || shouldUnregister) {
      control.unregister(name as FieldPath<TFieldValues>);
    }
  }

  return {
    swap,
    move,
    prepend,
    append,
    remove,
    insert,
    update,
    replace,
    cleanup,
    updateFormState,
    logPrivateVars: () => {
      console.log('ids', _ids);
      console.log('_actioned', _actioned);
    },
    watchFields: (observer) => {
      _observers.push(observer);
      return {
        unwatch: () => {
          _observers = _observers.filter((o) => o !== observer);
        },
      };
    },
  };
}
