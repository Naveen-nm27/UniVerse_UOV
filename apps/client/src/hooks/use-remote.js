import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
export function useRemote(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return;
        setData(null);
        setError("");
        return apiRequest(path, { signal: controller.signal });
      })
      .then((response) => {
        if (!controller.signal.aborted) setData(response);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [path, retry]);
  return { data, error, reload: () => setRetry((n) => n + 1) };
}
