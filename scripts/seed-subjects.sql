insert into public.subjects (name, description, "order")
select v.name, v.description, v.order_index
from (
  values
    ('Mathematics', null, 1),
    ('Physics', null, 2),
    ('Logical Reasoning', null, 3),
    ('Knowledge & History', null, 4),
    ('Drawing & Representation', null, 5)
) as v(name, description, order_index)
where not exists (
  select 1
  from public.subjects s
  where s.name = v.name
);
