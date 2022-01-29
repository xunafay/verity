import { System } from "../system";
import { Ticket } from "./base";

export type Container = StructureContainer | StructureStorage | StructureSpawn | StructureExtension | StructureTower;

export interface HarvestTicket extends Ticket {
    type: 'harvest',
    target: string,
}

export class HarvestTicketHelper {
    static create(room: Room, target: string, maxAssignees: number): HarvestTicket {
        let ticket: HarvestTicket = {
            assignees: [],
            maxAssignees: maxAssignees,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [WORK, CARRY, MOVE],
            target: target,
            type: 'harvest'
        }
        room.memory.tickets.push(ticket);
        return ticket;
    }
    static run(ticket: HarvestTicket, creep: Creep) {
        const source = creep.room.find(FIND_SOURCES)[0];

        if (creep.memory.work == null && creep.store.getUsedCapacity() > 0) {
            creep.memory.work = 'transferring';
        } else if (creep.memory.work == null) {
            creep.memory.work = 'harvesting';
        }

        // check if creep has to switch task
        if (creep.memory.work == 'harvesting' && creep.store.getFreeCapacity() == 0) {
            creep.memory.work = 'transferring';
        } else if (creep.memory.work == 'transferring' && creep.store.getUsedCapacity() == 0) {
            creep.memory.work = 'harvesting';
        }

        // do task
        if (creep.memory.work == 'harvesting') {
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        }

        const target = Game.getObjectById(ticket.target) as Container;

        if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    }
}
