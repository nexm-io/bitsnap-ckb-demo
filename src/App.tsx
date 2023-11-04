import { FunctionComponent, ReactNode, useContext, useEffect } from "react";
import styled from "styled-components";
import { Footer, Header } from "./components";
import { Buffer } from "buffer";
import { GlobalStyle } from "./config/theme";
import { ToggleThemeContext } from "./Root";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  max-width: 100vw;
`;

export type AppProps = {
  children: ReactNode;
};

export const App: FunctionComponent<AppProps> = ({ children }) => {
  const toggleTheme = useContext(ToggleThemeContext);

  useEffect(() => {
    // @ts-ignore
    (window as any).Buffer = Buffer;
  });

  return (
    <>
      <ToastContainer />
      <GlobalStyle />
      <Wrapper>
        <Header handleToggleClick={toggleTheme} />
        {children}
        <Footer />
      </Wrapper>
    </>
  );
};
