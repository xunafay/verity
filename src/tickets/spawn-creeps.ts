import { System } from "../system";
import { Ticket } from "./base";

export interface RoomSpawnTicket extends Ticket {
    type: 'spawnCreeps',
    body: BodyPartConstant[],
}

export class RoomSpawnTicketHelper {
    static create(room: Room): RoomSpawnTicket {
        if (room.find(FIND_MY_SPAWNS).length == 0) {
            throw new Error("No spawns present")
        }
        let ticket: RoomSpawnTicket = {
            assignees: [],
            maxAssignees: 0,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [],
            type: "spawnCreeps",
            body: [WORK, CARRY, MOVE],
            priority: 0,
        }

        room.memory.tickets.push(ticket)

        return ticket
    }

    static run(room: Room, ticket: RoomSpawnTicket) {
        let spawns = room.find(FIND_MY_SPAWNS)

        if (spawns.length == 0) {
            throw new Error("Spawn dissapeared");
        }

        const code = spawns[0].spawnCreep(ticket.body, System.getPid().toString());

        // delete ticket if success
        if (code == OK) {
            const index = room.memory.tickets.indexOf(ticket);
            room.memory.tickets.splice(index, 1);
        }
    }
}
