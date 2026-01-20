import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments
} from 'class-validator';

@ValidatorConstraint({ name: 'IsMatchingNested', async: false })
export class IsMatchingNestedConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const [relatedPropertyName] = args.constraints;
        const relatedValue = (args.object as any)[relatedPropertyName];

        // Check if the root value matches the value inside the nested 'account' object
        return value === relatedValue?.account_number || value === relatedValue?.routing_number;
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must match the value provided in the nested account object`;
    }
}

export function IsMatchingNested(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: IsMatchingNestedConstraint
        });
    };
}
