import { System } from "../system";
import { Ticket } from "./base";

export interface RoomUpgradeTicket extends Ticket {
    type: 'upgrade',
    targetControllerLevel: number,
}

export class RoomUpgradeTicketHelper {
    static create(room: Room): RoomUpgradeTicket {
        if (!room.controller) {
            throw new Error("Trying to create upgrade ticket for room without controller");
        }

        if (!room.controller.my) {
            throw new Error("Trying to create upgrade ticket for room controller by other player");
        }

        const targetLevel = room.controller.level + 1;
        return {
            assignees: [],
            maxAssignees: targetLevel,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [WORK, CARRY, MOVE],
            targetControllerLevel: targetLevel,
            type: 'upgrade'
        };
    }

    static run(creep: Creep) {
        if (!creep.room.controller) {
            console.log(`ERROR: creep(${creep.name}) tried upgrading controller in room without controller`);
            return;
        }

        // search for energy sources in room
        const source = creep.room.find(FIND_SOURCES)[0];
        // TODO: get closest source instead of first one

        // check if creep has to switch task
        if (creep.memory.work == 'harvesting' && creep.store.getFreeCapacity() == 0) {
            creep.memory.work = 'upgrading';
        } else if (creep.memory.work == 'upgrading' && creep.store.getUsedCapacity() == 0) {
            creep.memory.work = 'harvesting';
        }

        // do task
        if (creep.memory.work == 'harvesting') {
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source)
            }
        } else if (creep.memory.work == 'upgrading') {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller)
            }
        }
    }
}
