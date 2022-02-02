import { HarvestTicket } from '../tickets/harvest';
import { Logger } from './logger';

export class HarvestingSite {
    creep: Creep | undefined;
    container: StructureContainer | undefined;
    private _distance: number | null;

    constructor(public ticket: HarvestTicket) {
        if (ticket.assignees[0]) {
            this.creep = Game.creeps[ticket.assignees[0]];
        }

        if (ticket.container) {
            let container = Game.getObjectById(ticket.container) as StructureContainer | null;
            if (container) {
                this.container = container;
            }
        }

        this._distance = null;
    }

    distance(creep: Creep): number | null {
        if (this._distance) {
            return this._distance;
        }

        let distance = null;
        if (this.container) {
            distance = creep.pos.findPathTo(this.container).length;
        } else if (this.creep) {
            distance = creep.pos.findPathTo(this.creep).length;
        }

        this._distance = distance;
        return distance;
    }

    reservationAvailable(request_amount: number): boolean {
        if (this.ticket.reservations_locked == Game.time) {
            Logger.debug(`Reservations locked, skipping harvesting site(${this.ticket.pid})`, 'StaticHarvesting');
            return false;
        }

        let reserved = 0;
        for (const creep in this.ticket.reserved) {
            reserved += this.ticket.reserved[creep];
        }

        let available = 0;
        if (this.container) {
            available = this.container.store.getUsedCapacity() - reserved;
        } else if (this.creep) {
            available = this.creep.store.getUsedCapacity() - reserved;
        } else {
            return false;
        }

        return available >= request_amount;
    }

    reserve(creep: Creep): void {
        this.ticket.reserved[creep.name] = creep.store.getFreeCapacity();
    }

    release(creep: Creep): void {
        delete this.ticket.reserved[creep.name];
        this.ticket.reservations_locked = Game.time;
        Logger.debug(`releasing reservation for ticket(${this.ticket.pid}) creep(${creep.name}) and locking for one tick`, 'StaticHarvesting')
    }
}

export class StaticHarvesting {
    static collect(creep: Creep, room: Room) {
        let harvesting_tickets = creep.room.memory.tickets.filter(t => t.type == 'harvester') as Array<HarvestTicket>;
            let reservation = harvesting_tickets.find(t => t.reserved[creep.name] != null);
            if (!reservation) {
                let sites = harvesting_tickets.map(t => new HarvestingSite(t));
                let site = sites
                    .filter(s => s.reservationAvailable(creep.store.getFreeCapacity()))
                    .filter(s => s.distance(creep) != null)
                    .sort((a, b) => a.distance(creep)! - b.distance(creep)!)
                    .shift()

                if (site) {
                    Logger.debug(`Energy reservation made at ticket(${site.ticket.pid}) for creep(${creep.name}) for energy(${creep.store.getFreeCapacity()})`, 'StaticHarvesting');
                    site.reserve(creep);
                    reservation = site.ticket;
                }
            }

            if (reservation) {
                let site = new HarvestingSite(reservation);
                if (site.container) {
                    const code = creep.withdraw(site.container, RESOURCE_ENERGY);
                    Logger.debug('Code after withdraw: ' + code, 'HaulerHelper');
                    if (code == ERR_NOT_IN_RANGE) {
                        creep.moveTo(site.container);
                    } else if (code == OK) {
                        site.release(creep);
                    }
                } else if (site.creep) {
                    const code = site.creep.transfer(creep, RESOURCE_ENERGY);
                    if (code == ERR_NOT_IN_RANGE) {
                        creep.moveTo(site.creep);
                    } else if (code == OK) {
                        site.release(creep);
                    }
                }
            }
    }
}
