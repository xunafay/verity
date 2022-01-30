import { Logger } from "utils/logger";
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
            throw new Error("Trying to create upgrade ticket for room controller of other player");
        }

        const targetLevel = room.controller.level + 1;

        let ticket: RoomUpgradeTicket = {
            assignees: [],
            maxAssignees: targetLevel,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [WORK, CARRY, MOVE],
            targetControllerLevel: targetLevel,
            type: 'upgrade'
        };

        room.memory.tickets.push(ticket);

        return ticket
    }

    static run(creep: Creep) {
        if (!creep.room.controller) {
            Logger.error(`creep(${creep.name}) tried upgrading controller in room without controller`, 'UpgradeTicket');
            return;
        }

        if (creep.memory.work == null) {
            creep.memory.work = 'harvesting'
        }

        // search for energy sources in room
        const source = creep.room.find(FIND_SOURCES_ACTIVE)[0];
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
                creep.moveTo(source);
            }
        } else if (creep.memory.work == 'upgrading') {
            const code = creep.upgradeController(creep.room.controller);
            if (code == OK && !creep.room.controller.sign) {
                if (creep.signController(creep.room.controller, "Conquered by Verity under command of queens ~Xunafay & Amokami~") == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                }
            } else if (code == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
    }

    static isValid(ticket: RoomUpgradeTicket, room: Room): boolean {
        if (!room.controller) {
            return false;
        }

        return ticket.targetControllerLevel > room.controller.level;
    }
}
