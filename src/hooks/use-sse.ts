"use client";

import { useEffect, useRef, useCallback } from "react";

export function useSSE(onTasksUpdate: (tasks: unknown[]) => void) {
  const onUpdateRef = useRef(onTasksUpdate);
  onUpdateRef.current = onTasksUpdate;

  const connect = useCallback(() => {
    const es = new EventSource("/api/sse");

    es.addEventListener("tasks-update", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.tasks) {
          onUpdateRef.current(data.tasks);
        }
      } catch {
        // ignore parse errors
      }
    });

    es.onerror = () => {
      es.close();
      // 再接続（3秒後）
      setTimeout(connect, 3_000);
    };

    return es;
  }, []);

  useEffect(() => {
    const es = connect();
    return () => es.close();
  }, [connect]);
}
