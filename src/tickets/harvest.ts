import { Logger } from "utils/logger";
import { System } from "../system";
import { Ticket } from "./base";

export interface HarvestTicket extends Ticket {
    type: 'harvester',
    source: string,
    container?: string,
    reserved: {
        [key: string]: number
    },
    reservations_locked: number, // store does not update until next tick, thus we lock reservations after withdrawal for 1 tick
}

export class HarvestTicketHelper {
    static create(room: Room, maxAssignees: number, source: string, container?: string): HarvestTicket {
        let ticket: HarvestTicket = {
            assignees: [],
            maxAssignees: maxAssignees,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [WORK, CARRY, MOVE],
            source: source,
            container: container,
            type: 'harvester',
            reserved: {},
            reservations_locked: 0,
        }

        room.memory.tickets.push(ticket);
        return ticket;
    }

    static run(creep: Creep, room: Room, ticket: HarvestTicket) {
        let source = Game.getObjectById(ticket.source) as Source;

        if (Game.time % 10 == 0 && !ticket.container) {
            const container = creep.room.find(FIND_STRUCTURES)
            .filter(structure => structure.structureType == STRUCTURE_CONTAINER && structure.pos.inRangeTo(source.pos, 3))
            .shift() as StructureContainer | undefined;

            if (container) {
                ticket.container = container.id;
                Logger.notice('Container found for harvester ticket', 'HarvestTicketHelper');
            }
        }

        if (creep.store.getFreeCapacity() == 0) {
            if (ticket.container) {
                const container =  Game.getObjectById(ticket.container) as StructureContainer;
                if (container) {
                     if (creep.transfer(container, RESOURCE_ENERGY, creep.store.getUsedCapacity()) == ERR_NOT_IN_RANGE) {
                         creep.moveTo(container);
                     }
                } else {
                    Logger.error(`No container present for harvester(${creep.id}) with ticket(${ticket.pid})`, 'HarvestTicketHelper');
                }
            }
        }

        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
    }
}
