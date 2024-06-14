// src/styles/GlobalStyles.ts
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');

  body {
    font-family: ${(props) => props.theme.fontFamily};
    background-color: ${(props) => props.theme.bodyBg};
    color: ${(props) => props.theme.textColor};
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  tr, td {
    height: 64px;
  }
`;

export default GlobalStyle;
