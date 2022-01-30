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
            type: 'hauler',
            priority: 50
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
        if (creep.memory.work == 'harvesting') {
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        } else if (creep.memory.work == 'transferring') {
            const target = Game.getObjectById(ticket.target) as Container;

            const code = creep.transfer(target, RESOURCE_ENERGY);
            if(code == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            } else if (code == ERR_FULL) {
                creep.room.memory.tickets.splice(creep.room.memory.tickets.indexOf(ticket), 1);
                creep.memory.ticket = undefined;
                // TODO: also unnasign other creeps from task
            }
        }
    }
}
