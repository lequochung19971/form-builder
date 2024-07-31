import getProxyFormState from '@/form/logic/getProxyFormState';
import shouldRenderFormState from '@/form/logic/shouldRenderFormState';
import { useFormSubscribe } from '@/form/useFormSubscribe';
import { useEffect, useRef, useState } from 'react';
import { FieldValues, FormState, InternalFieldName, UseFormReturn } from 'react-hook-form';
import { ComponentProps, FormComponentInstance } from './types';
import { useUIComponent } from './useUIComponent';

export const useFormComponent = (props: ComponentProps) => {
  const { actions, componentInstance, mappedComponentName, computed } = useUIComponent(props);

  const _formControl = useRef<UseFormReturn | undefined>();
  _formControl.current = componentInstance.__formControl as UseFormReturn;
  const formControl = _formControl.current.control;

  const [formState, updateFormState] = useState<FormState<FieldValues>>(formControl._formState);

  useFormSubscribe({
    subject: formControl._subjects.state,
    next: (value: Partial<FormState<FieldValues>> & { name?: InternalFieldName }) => {
      if (
        shouldRenderFormState(
          value,
          formControl._proxyFormState,
          formControl._updateFormState,
          true
        )
      ) {
        updateFormState({ ...formControl._formState });
      }
    },
  });

  useEffect(() => {
    if (formControl._proxyFormState.isDirty) {
      const isDirty = formControl._getDirty();
      if (isDirty !== formState.isDirty) {
        formControl._subjects.state.next({
          isDirty,
        });
      }
    }
  }, [formControl, formState.isDirty]);

  // React.useEffect(() => control._disableForm(props.disabled), [control, props.disabled]);

  // React.useEffect(() => {
  //   if (props.values && !deepEqual(props.values, _values.current)) {
  //     control._reset(props.values, control._options.resetOptions);
  //     _values.current = props.values;
  //     updateFormState((state) => ({ ...state }));
  //   } else {
  //     control._resetDefaultValues();
  //   }
  // }, [props.values, control]);

  // React.useEffect(() => {
  //   if (props.errors) {
  //     control._setErrors(props.errors);
  //   }
  // }, [props.errors, control]);

  useEffect(() => {
    if (!formControl._state.mount) {
      formControl._updateValid();
      formControl._state.mount = true;
    }

    if (formControl._state.watch) {
      formControl._state.watch = false;
      formControl._subjects.state.next({ ...formControl._formState });
    }

    formControl._removeUnmounted();
  });

  // React.useEffect(() => {
  //   props.shouldUnregister &&
  //     control._subjects.values.next({
  //       values: control._getWatch(),
  //     });
  // }, [props.shouldUnregister, control]);

  _formControl.current.formState = getProxyFormState(formState, _formControl.current.control);

  return {
    mappedComponentName,
    componentInstance: componentInstance as FormComponentInstance,
    formState,
    formControl: _formControl.current,
    actions,
    computed,
  };
};
