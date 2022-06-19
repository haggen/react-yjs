import {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { WebrtcProvider } from "y-webrtc";
import { Doc, Map as YMap } from "yjs";

// const Context = useContext({});

export const Room = ({ roomId }) => {
  const providerRef = useRef<WebrtcProvider>(null);
  const docRef = useRef<Doc>(null);
  const stateRef = useRef<YMap<any>>(null);

  useEffect(() => {
    console.log("Create doc");

    docRef.current = new Doc();
    stateRef.current = docRef.current.getMap("state");

    return () => {
      docRef.current.destroy();
      docRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    console.log("Create provider");

    providerRef.current = new WebrtcProvider(roomId, docRef.current);

    return () => {
      providerRef.current.disconnect();
      providerRef.current = undefined;
    };
  }, [roomId]);

  let awarenessLocalStateSnapshot =
    providerRef.current?.awareness.getLocalState();

  const awarenessLocalState = useSyncExternalStore(
    (onStoreChange) => {
      const handler = (...args) => {
        console.log("awarenessLocalState: subscribe", args);
        awarenessLocalStateSnapshot = {
          ...providerRef.current?.awareness.getLocalState(),
        };
        onStoreChange();
      };
      providerRef.current?.awareness.on("change", handler);
      return () => {
        providerRef.current?.awareness.off("change", handler);
      };
    },
    () => {
      return awarenessLocalStateSnapshot;
    }
  );

  let awarenessRemoteStatesSnapshot =
    providerRef.current?.awareness.getStates();

  const awarenessRemoteStates = useSyncExternalStore(
    (onStoreChange) => {
      const handler = (...args) => {
        console.log("awarenessRemoteStates: subscribe", args);
        awarenessRemoteStatesSnapshot = new Map(
          providerRef.current?.awareness.getStates()
        );
        onStoreChange();
      };
      providerRef.current?.awareness.on("change", handler);
      return () => {
        providerRef.current?.awareness.off("change", handler);
      };
    },
    () => {
      return awarenessRemoteStatesSnapshot;
    }
  );

  let snapshot = stateRef.current?.toJSON();

  const sharedState = useSyncExternalStore(
    (onStoreChange) => {
      const observer = () => {
        snapshot = stateRef.current?.toJSON();
        onStoreChange();
      };

      stateRef.current?.observe(observer);
      return () => {
        stateRef.current?.unobserve(observer);
      };
    },
    () => {
      return snapshot;
    }
  );

  const update = (transaction) => {
    docRef.current?.transact(() => {
      transaction(stateRef.current);
    });
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value: name } = event.currentTarget;
    if (name) {
      providerRef.current?.awareness.setLocalStateField("name", name);
    }
  };

  const handleTodoAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { value: todo } = event.currentTarget.elements["todo"];
    if (todo) {
      update((state) => {
        const todos = state.get("todos") ?? [];
        todos.push({ text: todo, checked: false });
        state.set("todos", todos);
      });
      event.currentTarget.reset();
    }
  };

  const handleTodoChange = (
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { checked } = event.currentTarget;

    update((state) => {
      const todos = state.get("todos");
      todos[index].checked = checked;
      state.set("todos", todos);
    });
  };

  console.log({
    sharedState: JSON.stringify(sharedState),
    awarenessLocalState: JSON.stringify(awarenessLocalState),
    awarenessRemoteStates: JSON.stringify(awarenessRemoteStates),
  });

  return (
    <>
      <h1>Room: {roomId}</h1>

      <ul>
        {Array.from(awarenessRemoteStates ?? []).map(([id, state]) => (
          <li key={id}>{state.name}</li>
        ))}
      </ul>

      <label>
        Name:
        <input
          type="text"
          value={awarenessLocalState?.name ?? ""}
          onChange={handleNameChange}
        />
      </label>

      <hr />

      <form onSubmit={handleTodoAdd}>
        <label>
          Todo:
          <input type="text" name="todo" />
        </label>
        <button type="submit">Add</button>
      </form>

      <ul>
        {sharedState?.todos?.map((todo, index) => (
          <li key={index}>
            <label>
              <input
                type="checkbox"
                checked={todo.checked}
                onChange={(e) => handleTodoChange(e, index)}
              />
              {todo.text}
            </label>
          </li>
        ))}
      </ul>
    </>
  );
};
