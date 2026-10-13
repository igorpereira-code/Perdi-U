import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';

// jsdom does not include these; React Router needs them
Object.assign(globalThis, { TextEncoder, TextDecoder });
