alter table orders drop constraint orders_status_check;

alter table orders
    add constraint orders_status_check
        check (status in ('PLACED', 'ACCEPTED', 'IN_PREPARATION', 'READY', 'PICKED_UP', 'REJECTED', 'CANCELLED'));
