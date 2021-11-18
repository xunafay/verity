import { ErrorMapper } from "utils/ErrorMapper";

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
  }

  interface CreepMemory {
    role: string;
    room: string;
    working: boolean;
  }

  interface RoomMemory {
    tasks: any[];
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Verity status:
  Game tick: ${Game.time}
  CPU: ${Game.cpu.bucket}
`);

  for (const name in Game.rooms) {
    const room = Game.rooms[name];
    if (room.controller && room.controller.my) { // if room has controller and is owned by me
      const taskExists = room.memory.tasks.some((task) => task.type == 'upgrade_controller');
    }
  }

  // find tasks in room
    // spawn creeps
    // keep controller alive
    // build roads
    // build extensions
    // build towers
    // build containers
    // build walls
  // delegate tasks
  // run creeps

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  if (Game.cpu.bucket == 10000) {
    Game.cpu.generatePixel();
  }
});

const amandaiscute = {
  age: 19,
  name: 'Amanda',
  something: {

  }
};

export interface Task {
  type: 'build',
  location: RoomPosition,
}

export interface ControllerTask extends Task {

}

export class Something implements ControllerTask {
  type: 'upgrade_controller';
  location: RoomPosition;
}
