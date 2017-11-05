// Error handling philosophy: All errors are logged to stderr, but the process never completely stops

export let handleError = (error: any | undefined) => {
  if (error) {
    console.error('ERROR: ' + error);
  }
};

export let createFake = (functionName: string) => {
  return (...args: any[]) => {
    console.error('FAKE: ' + functionName + ' ', ...args)
  }
};
