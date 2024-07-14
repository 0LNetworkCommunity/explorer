import { FC, PropsWithChildren, createRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-solarizedlight.min.css';

type Props = PropsWithChildren<{
  plugins?: string[];
  lang: string;
}>;

const Code: FC<Props> = ({ plugins = [], lang, children }) => {
  const codeEl = createRef<HTMLElement>();

  useEffect(() => {
    if (!codeEl.current) {
      return;
    }

    Prism.highlightElement(codeEl.current);
  }, [plugins.join(' '), lang, children]);

  return (
    <pre className={plugins.join(' ')}>
      <code ref={codeEl} className={`language-${lang}`}>
        {children}
      </code>
    </pre>
  );
};

export default Code;
