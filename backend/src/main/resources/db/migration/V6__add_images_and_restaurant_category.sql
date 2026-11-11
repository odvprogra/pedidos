alter table restaurants
    add column category varchar(20) not null default 'OTHER'
        constraint restaurants_category_check
            check (category in ('TRADITIONAL', 'GRILL', 'CHICKEN', 'PIZZA', 'BURGERS', 'SUSHI', 'CAFE', 'OTHER')),
    add column image_url varchar(500);

alter table restaurants alter column category drop default;

alter table products add column image_url varchar(500);
