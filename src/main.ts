import { ErrorMapper } from "utils/ErrorMapper";
import { System } from './system';
import { Ticket } from './tickets/base';
import { RoomManager } from './room-manager';
import { Logger } from "utils/logger";

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
        pid: number;
        log: any;
        tickets: Ticket[];
        clear: boolean;
    }

    interface CreepMemory {
        ticket?: number;
        work?: string;
    }

    interface RoomMemory {
        tickets: Ticket[];
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
    Logger.info(`Verity status: CPU: ${Game.cpu.bucket}`, 'system');

    if (Memory.tickets == null) { Memory.tickets = []; }
    if (Memory.clear == true) {
        Logger.notice('Clearing memory', 'System');
        Memory.clear = false;
        Memory.tickets = [];
        for (const room in Memory.rooms) {
            Memory.rooms[room].tickets = [];
        }

        for (const creep in Memory.creeps) {
            Memory.creeps[creep].ticket = undefined;
            Memory.creeps[creep].work = undefined;
        }
    }

    for (const name in Game.rooms) {
        const room = Game.rooms[name];
        const roomManager = new RoomManager(room);
        roomManager.cleanUpTickets();
        roomManager.createTickets();
        roomManager.executeTickets();
        roomManager.assignTickets();
    }

    System.cleanUpMemory();

    if (Game.cpu.bucket == 10000) {
        Game.cpu.generatePixel();
    }
});
