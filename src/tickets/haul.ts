import { System } from "../system";
import { Ticket } from "./base";
import { HarvestTicket } from "./harvest";
import { HarvestingSite, StaticHarvesting } from '../utils/static-harvesting';
import { Logger } from "utils/logger";

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

        Logger.debug(`Created hauler ticket(${ticket.pid})`, 'HaulerTicketHelper');
        room.memory.tickets.push(ticket);
        return ticket;
    }

    static run(ticket: HaulerTicket, creep: Creep) {
        const source = creep.room.find(FIND_SOURCES_ACTIVE)[0];

        if (creep.memory.work == null && creep.store.getUsedCapacity() > 0) {
            creep.memory.work = 'dropping';
        } else if (creep.memory.work == null) {
            creep.memory.work = 'collecting';
        }

        // check if creep has to switch task
        if (creep.memory.work == 'collecting' && creep.store.getFreeCapacity() == 0) {
            creep.memory.work = 'dropping';
        } else if (creep.memory.work == 'dropping' && creep.store.getUsedCapacity() == 0) {
            creep.memory.work = 'collecting';
        }

        // do task
        if (creep.memory.work == 'collecting') {
            StaticHarvesting.collect(creep, creep.room);
        } else if (creep.memory.work == 'dropping') {
            const target = Game.getObjectById(ticket.target) as Container;

            const code = creep.transfer(target, RESOURCE_ENERGY);
            if(code == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            } else if (code == ERR_FULL) {
                creep.room.memory.tickets.splice(creep.room.memory.tickets.indexOf(ticket), 1);
                creep.memory.ticket = undefined;
                creep.memory.work = undefined;
                // TODO: also unnasign other creeps from task
            }
        }
    }
}
