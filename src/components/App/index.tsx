import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Room } from "../Room";

import styles from "./style.module.css";

type Params = { roomId: string };

export const App = () => {
  const [match, params] = useRoute<Params>("/:roomId");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!match) {
      setLocation("/" + nanoid(4));
    }
  }, [match, setLocation]);

  if (!match) {
    return <div>Loading…</div>;
  }

  return (
    <div>
      <Room roomId={params.roomId} />
    </div>
  );
};
