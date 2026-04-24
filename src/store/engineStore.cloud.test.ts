import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEngineStore, type CloudEngineSnapshot } from './engineStore';

const snapshot: CloudEngineSnapshot = {
  runtime: {
    id: 'cloud',
    engine: 'stockfish',
    engineVersion: 'stockfish-18',
    active: true,
    ready: true,
    status: 'ready',
    statusMessage: 'Backend engine ready',
    path: '/usr/local/bin/stockfish',
  },
  config: {
    threads: 6,
    hashSize: 256,
    multiPv: 4,
    skillLevel: 18,
    useNNUE: true,
    analysisMode: 'time',
    maxDepth: 24,
    maxTimePerMove: 8,
    energySavingMode: true,
  },
  logs: ['[10:00:00] Engine ready'],
};

describe('engineStore cloud sync', () => {
  afterEach(() => {
    useEngineStore.setState(useEngineStore.getInitialState());
    vi.restoreAllMocks();
  });

  it('hydrates cloud snapshot into shared runtime and config state', () => {
    useEngineStore.getState().hydrateCloudSnapshot(snapshot);
    const state = useEngineStore.getState();

    expect(state.cloudRuntime.engineVersion).toBe('stockfish-18');
    expect(state.status).toBe('ready');
    expect(state.threads).toBe(6);
    expect(state.analysisMode).toBe('time');
    expect(state.commandLogs).toEqual(snapshot.logs);
    expect(state.lastHydratedAt).not.toBeNull();
  });

  it('does not overwrite local runtime state when a cloud snapshot arrives while local mode is selected', () => {
    useEngineStore.setState({
      selectedEngine: 'local-wasm',
      status: 'ready',
      statusMessage: 'Local engine ready',
    });

    useEngineStore.getState().hydrateCloudSnapshot(snapshot);
    const state = useEngineStore.getState();

    expect(state.status).toBe('ready');
    expect(state.statusMessage).toBe('Local engine ready');
    expect(state.cloudRuntime.engineVersion).toBe('stockfish-18');
  });

  it('sends cloud config updates through the socket without optimistic local mutation', async () => {
    const emit = vi.fn();

    useEngineStore.setState({
      selectedEngine: 'cloud',
      selectedEngineVersion: 'stockfish-16',
      socket: {
        emit,
        connected: true,
      } as any,
    });

    await useEngineStore.getState().applyCloudConfig({ engineVersion: 'stockfish-18', threads: 8 });
    const state = useEngineStore.getState();

    expect(emit).toHaveBeenCalledWith('engine:update_config', {
      engineVersion: 'stockfish-18',
      threads: 8,
    });
    expect(state.selectedEngineVersion).toBe('stockfish-16');
    expect(state.threads).not.toBe(8);
  });
});
