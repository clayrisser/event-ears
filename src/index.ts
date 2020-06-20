import { EventEmitter } from 'events';

export default class EventEars {
  constructor(
    public readonly eventEmitter: EventEmitter,
    public readonly listeners: Listeners
  ) {
    Object.entries(this.listeners).forEach(
      ([event, listener]: [Event, Listener]) => {
        this.eventEmitter.on(event, listener);
      }
    );
  }

  cleanup() {
    Object.entries(this.listeners).forEach(
      ([event, listener]: [Event, Listener]) => {
        this.eventEmitter.removeListener(event, listener);
      }
    );
  }
}

export function promisify(
  eventEmitter: EventEmitter,
  event: Event,
  errorEvent?: Event,
  errorDetector: (err: Error) => boolean | string = () => true
) {
  return new Promise((resolve, reject) => {
    let detectError = errorDetector as (err: Error) => boolean;
    if (typeof errorDetector === 'string') {
      detectError = (err: Error) => err.message.indexOf(errorDetector) > -1;
    }
    function errorListener(err: Error) {
      if (detectError(err)) {
        eventEmitter.removeListener(event, errorListener);
        eventEmitter.removeListener(event, listener);
        return reject(err);
      }
    }
    function listener(...args: any[]) {
      eventEmitter.removeListener(event, listener);
      if (errorEvent) eventEmitter.removeListener(errorEvent, errorListener);
      if (args.length <= 0) return resolve();
      const arg = args[0];
      if (arg instanceof Error) return reject(arg);
      if (args.length === 1) return resolve(arg);
      return resolve(args);
    }
    if (errorEvent) eventEmitter.on(errorEvent, errorListener);
    eventEmitter.on(event, listener);
  });
}

export type Listener = (...args: any[]) => void;

export type Event = string | symbol;

export interface Listeners {
  [event: string]: Listener;
}
