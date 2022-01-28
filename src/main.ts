import { RoomSpawnTicket, RoomSpawnTicketHelper } from "tickets/spawn-creeps";
import { ErrorMapper } from "utils/ErrorMapper";
import { System } from './system';
import { Ticket } from './tickets/base';
import { RoomUpgradeTicketHelper, RoomUpgradeTicket } from './tickets/upgrade';

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
  }

  interface CreepMemory {
    ticket?: number;
    work: string;
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
  console.log(`Verity status:
  Game tick: ${Game.time}
  CPU: ${Game.cpu.bucket}`);

  if (Memory.pid == null) {
    Memory.pid = 0;
  }
  if (Memory.tickets == null) { Memory.tickets = []; }

  // find tasks in room
  if (Object.keys(Game.creeps).length < 3) {
    Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], System.getPid().toString())
  }

  // create controller upgrade ticket
  for (const name in Game.rooms) {
    const room = Game.rooms[name];

    if (room.memory.tickets == null) {
      room.memory.tickets = []
    }

    if (room.controller && room.controller.my) { // if room has controller and is owned by me
      const ticketExists = room.memory.tickets.some(tickets => tickets.type == 'upgrade');
      if (!ticketExists) {
        RoomUpgradeTicketHelper.create(room);
      }
    }

    // assign tickets
    let creeps = room.find(FIND_MY_CREEPS);
    creeps.forEach(creep => {
      if (!creep.memory.ticket) {
        const ticket = room.memory.tickets.find(ticket => ticket.assignees.length < ticket.maxAssignees);
        if (ticket) {
          ticket.assignees.push(creep.name);
          creep.memory.ticket = ticket.pid;
        }
      }
    });

    //
    for (const creep of creeps) {
      if (creep.memory.ticket) {
        const ticket = room.memory.tickets.find(ticket => ticket.pid == creep.memory.ticket);
        if (ticket && ticket.type == 'upgrade') {
          RoomUpgradeTicketHelper.run(creep);
        }
      }
    }
    let spawn_ticket = room.memory.tickets.find(ticket => {
      return ticket.type == 'spawnCreep'
    }) as RoomSpawnTicket | undefined;
    if (spawn_ticket != null) {
      RoomSpawnTicketHelper.run(room, spawn_ticket)
    }
  }



  // if task is found, refer to separate file
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
