import { nanoid } from "nanoid";
import { FormEvent, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useEvent } from "../../lib/useEvent";
import { useSharedState } from "../../lib/useSharedState";

type State = {
  list: string[];
  participants: string[];
};

export const App = () => {
  const [match, params] = useRoute<{ roomId: string }>("/:roomId");
  const [, setLocation] = useLocation();
  const { store, state } = useSharedState<State>();

  console.log("App rendered");

  useEffect(() => {
    if (!match) {
      return;
    }

    store.connect(params.roomId);

    return () => {
      store.disconnect();
    };
  }, [match, params, store]);

  useEffect(() => {
    store.update((state) => {
      const participants = state.get("participants") ?? [];
      participants.push(prompt("Name") ?? "Anonymous");
      state.set("participants", participants);
    });
  }, [store]);

  const handleSubmit = useEvent((e: FormEvent<HTMLFormElement>) => {
    const { value } = e.currentTarget.elements.namedItem(
      "item"
    ) as HTMLInputElement;

    e.preventDefault();

    store.update((state) => {
      const list = state.get("list") ?? [];
      list.push(value);
      state.set("list", list);
    });
  });

  if (!match) {
    setLocation("/" + nanoid(4));
    return <div>Loading…</div>;
  }

  return (
    <div>
      <h1>Room: {params.roomId}</h1>

      <form onSubmit={handleSubmit}>
        <input type="text" name="item" required />
        <button type="submit">Add</button>
      </form>

      <ul>
        {state.participants?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <ul>
        {state.list?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};
