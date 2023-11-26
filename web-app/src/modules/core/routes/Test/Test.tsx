import { FC, useEffect, useState } from "react";
import useAptos from "../../../aptos";
import MessageForm from "./MessageForm";

const Test: FC = () => {
  const [message, setMessage] = useState('');
  const aptos = useAptos();

  useEffect(() => {
    const load = async () => {
      const res = await aptos.getAccountResource(
        '0xD0383924341821F9E43A6CFF46F0A74E', '0xD0383924341821F9E43A6CFF46F0A74E::message::MessageHolder');
      console.log(res);
      setMessage((res.data as any).message);
    };
    load();
  }, []);

  return (
    <div className="h-full">
      <h1>Test</h1>
      <div>{`message = ${message}`}</div>

      <MessageForm />

    </div>
  );
};

export default Test;
