import { useLanguage } from '../../i18n';
import { json } from '@codemirror/lang-json';
import type { PublicAnnotationInput } from '../../annotation/schema';
import { atomone } from '@uiw/codemirror-theme-atomone';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

const JsonEditor = forwardRef<
  {
    jsonEditor: () => ReactCodeMirrorRef | null;
    set(newValue: unknown): void;
    isFocused: () => boolean;
  },
  { value?: string | PublicAnnotationInput; onChange: (v: string) => void }
>(({ value = '', onChange }, ref) => {
  useLanguage();
  const [internalValue, setInternalValue] = useState(() => {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
  });
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  const handleChange = useCallback(
    (val: string) => {
      setInternalValue(val);
      onChange?.(val);
    },
    [onChange],
  );

  useEffect(() => {
    const newValue =
      typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    if (newValue !== internalValue) {
      setInternalValue(newValue);
    }
  }, [value]);

  useImperativeHandle(
    ref,
    () => ({
      jsonEditor: () => {
        return editorRef.current;
      },
      set(newValue: unknown) {
        const jsonString =
          typeof newValue === 'string'
            ? newValue
            : JSON.stringify(newValue, null, 2) ?? '';
        setInternalValue(jsonString);
      },
      isFocused() {
        return editorRef.current?.view?.hasFocus || false;
      },
    }),
    [],
  );

  return (
    <div style={{ height: '100%' }}>
      <CodeMirror
        ref={editorRef}
        value={internalValue}
        height="100%"
        theme={atomone}
        extensions={[json()]}
        onChange={handleChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
          searchKeymap: false,
        }}
      />
    </div>
  );
});

export default JsonEditor;
