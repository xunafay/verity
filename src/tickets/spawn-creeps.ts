import { getPackedSettings } from "http2";
import { find } from "lodash";
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
            body: [WORK, CARRY, MOVE]
        }

        room.memory.tickets.push(ticket)

        return ticket
    }

    static run(room: Room, ticket: RoomSpawnTicket) {
        let spawns = room.find(FIND_MY_SPAWNS)

        if (spawns.length == 0) {
            throw new Error("Spawn dissapeared");
        }

        spawns[0].spawnCreep(ticket.body, System.getPid().toString())
    }
}
