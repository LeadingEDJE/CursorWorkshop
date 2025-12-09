Implement the following:

Task Purpose

For SOFT DELETE API : Logic to Soft Delete store attributes from DB

    

Tech Notes

This is a soft delete, which mark Store attr field markfordelete as true.

    

Question:-

is attribute value is also soft delete or hard delete?

Value should be hard delete

    

Do we need to display soft delete attributes in UI ?

Yes, at the end of the table ( in greyed out font)

    

Acceptance Criteria

Given : for store attributes

when: we need to get them deleted

then: Store attr field markfordelete as true

and then : the attribute is soft deleted

display soft delete attributes in UI in greyed out format