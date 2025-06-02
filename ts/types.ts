type Config = {
	submit?: string;
	inputs: Input[];
	showErrors?: boolean;
	update?: boolean;
	additionalTriggers?: { selector: string; event: string }[];
};

type Input<T extends Type = Type> = {
	selector: string;
	checkHidden?: boolean;
	requirements: Requirements<T>;
};

type Type = 'select' | 'choices' | 'inputs' | 'string' | 'email' | 'tel' | 'checkbox' | 'children' | 'number' | 'length' | 'amount' | 'function' | 'any' | 'none';

type Requirements<T extends Type = Type> = T extends 'choices'
	? { type: T; choices: string[] }
	: T extends 'number'
	? { type: T; min?: number; max?: number }
	: T extends 'string'
	? { type: T; min?: number; max?: number; regex?: RegExp }
	: T extends 'children'
	? { type: T; symbol: '>' | '<' | '='; number: number; selector: string }
	: T extends 'amount'
	? { type: T; symbol: '>' | '<' | '='; number: number; selector: string }
	: T extends 'select'
	? { type: T; options: { [key: string]: Requirements<'inputs'> } }
	: T extends 'inputs'
	? { type: T; inputs: Input[] }
	: T extends 'function'
	? { type: T; function: Function }
	: T extends 'none'
	? { type: T; hasToBeEmpty?: boolean }
	: { type: T };

type Receipt = {
	inputs: { selector: string; event: string; observer?: MutationObserver }[];
	abortController: AbortController;
	submit?: string;
};

export { Config, Input, Requirements, Type, Receipt };
