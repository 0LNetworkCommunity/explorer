(function () {
  const promises = new Map();
  const eventListeners: any[] = [];

  window.addEventListener(
    "message",
    (event) => {
      if (event.data.__postero_disconnect__) {
        for (const promise of promises.values()) {
          try {
            promise.reject(new Error("connection lost"));
          } catch (err) {
            console.error(err);
          }
        }
        promises.clear();
      } else if (event.data.__postero_result__) {
        const response = event.data.__postero_result__;

        if (response.id) {
          const responseId = parseInt(response.id, 10);
          const promise = promises.get(responseId);
          if (promise) {
            promises.delete(responseId);
            if (response.error) {
              promise.reject(response.error);
            } else {
              promise.resolve(response.result);
            }
          }
        } else {
          for (const eventListener of eventListeners) {
            setTimeout(() => {
              eventListener(response);
            }, 0);
          }
        }
      }
    },
    false
  );

  let rpcId = 0;

  const rpcCall = (method: string, params?: any) => {
    const id = ++rpcId;
    const promise = new Promise((resolve, reject) => {
      promises.set(id, { resolve, reject });

      window.postMessage({
        __postero__: {
          jsonrpc: "2.0",
          method,
          params,
          id: `${id}`,
        },
      });
    });

    return promise;
  };

  function disconnect() {
    return rpcCall("disconnect");
  }

  function connect() {
    return rpcCall("connect", [window.location.toString()]);
  }

  function signMessage(payload: any) {
    return rpcCall("signMessage", [payload]);
  }

  function signTransaction(payload: any) {
    return rpcCall("sign_transaction", [payload]);
  }

  function signAndSubmitTransaction(payload: any) {
    return rpcCall("sign_and_submit_transaction", [payload]);
  }

  function onEvent(eventListener: any) {
    eventListeners.push(eventListener);
    return () => {
      const index = eventListeners.indexOf(eventListener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    };
  }

  rpcCall("__init__", [window.location.toString()]);

  const win = window as any;
  win.postero = {
    connect,
    disconnect,
    signMessage,
    signTransaction,
    signAndSubmitTransaction,
    onEvent,
  };
})();
