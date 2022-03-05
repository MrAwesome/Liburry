// NOTE: this file should be kept as sparse as possible, since logic here won't be unit tested.
import "setimmediate";
import SearchWorkerStateMachine, {getSearchWorkerMessageHandler} from "./SearchWorkerStateMachine";

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

// This is where we set up the listener that allows our search workers to respond to commands from the main thread.
ctx.addEventListener("message", getSearchWorkerMessageHandler(new SearchWorkerStateMachine(ctx)));

export default null as any;
