import { System } from "../system";
import { Ticket } from "./base";

export type Container = StructureContainer | StructureStorage | StructureSpawn | StructureExtension | StructureTower;

export interface HaulerTicket extends Ticket {
    type: 'hauler',
    target: string,
}

export class HaulerTicketHelper {
    static create(room: Room, target: string, maxAssignees: number): HaulerTicket {
        let ticket: HaulerTicket = {
            assignees: [],
            maxAssignees: maxAssignees,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [WORK, CARRY, MOVE],
            target: target,
            type: 'hauler'
        }
        room.memory.tickets.push(ticket);
        return ticket;
    }

    static run(ticket: HaulerTicket, creep: Creep) {
        const source = creep.room.find(FIND_SOURCES_ACTIVE)[0];

        if (creep.memory.work == null && creep.store.getUsedCapacity() > 0) {
            creep.memory.work = 'transferring';
        } else if (creep.memory.work == null) {
            creep.memory.work = 'hauling';
        }

        // check if creep has to switch task
        if (creep.memory.work == 'hauling' && creep.store.getFreeCapacity() == 0) {
            creep.memory.work = 'transferring';
        } else if (creep.memory.work == 'transferring' && creep.store.getUsedCapacity() == 0) {
            creep.memory.work = 'hauling';
        }

        // do task
        if (creep.memory.work == 'hauling') {
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
