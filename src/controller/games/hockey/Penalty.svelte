<script lang="ts">
    import {
        Button,
        Input,
        InputGroup
    } from 'sveltestrap';
    import type { Penalty } from '../../../games/hockey';
    import { parseTimeString, timeToString } from '../../../SharedUtilities';

    export let type: 'new' | 'existing' = 'existing';
    export let penalty: Penalty | undefined = {
        id: Math.floor(Math.random() * 0xFFFF),
    } as Penalty;
    // export let _penalty: Penalty | undefined = {
    //     id: Math.floor(Math.random() * 0xFFFF),
    // } as Penalty;
    // let penalty = Object.assign({}, _penalty);
    export let index: number = undefined;

    export let action: (penalty: Penalty) => void = () => {};
    export let updateAction: (penalty: Penalty, index: number) => void = () => {};

    let enabled = true;

    function updatePlayer(e: FocusEvent) {
        penalty.player = (<HTMLInputElement>e.target).valueAsNumber || undefined;
        updateAction(penalty, index);
    }

    function updateInfraction(e: FocusEvent) {
        penalty.offense = (<HTMLInputElement>e.target).value;
        updateAction(penalty, index);
    }

    function updateTime(e: FocusEvent) {
        penalty.remainingTime = (<HTMLInputElement>e.target).value ? parseTimeString((<HTMLInputElement>e.target).value) : undefined;
        updateAction(penalty, index);
    }

    window.addEventListener('clockTick', () => {
        // console.log(type, penalty.id, penalty.remainingTime);
        if (type === 'existing' && enabled) {
            if (penalty.remainingTime > 0) {
                penalty.remainingTime -= 0.1;
            }
            if (penalty.remainingTime <= 0) {
                action(penalty);
                enabled = false;
            }
        }
    });

    console.count('penaltyRender');
</script>

<InputGroup class="mt-2">
    <Input type="number" placeholder="#" value={penalty?.player} on:blur={updatePlayer} />
    <Input type="text" placeholder="Infraction" value={penalty?.offense} on:blur={updateInfraction} />
    <Input
        type="text"
        placeholder="Time"
        list="penaltyDurations"
        value={penalty.remainingTime ? timeToString(penalty.remainingTime) : ''}
        on:blur={updateTime}
    />
    <Button
        outline
        color="{type === 'existing' ? 'danger' : 'success'}"
        on:click={() => {action(penalty)}}
    >
        <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <use href="/feather-sprite.svg#{type === 'existing' ? 'trash': 'plus'}" />
        </svg>
    </Button>
</InputGroup>