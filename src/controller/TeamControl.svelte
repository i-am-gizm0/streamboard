<script lang="ts">
    import type { Team } from "../SharedDefinitions";


    export let team: Team;
    export let setFlag: (value: boolean) => void;
    export let clearPossession: () => void;


    $: if (team.score < 0) { // There aren't negative scores in most sports
        team.score = 0;
    }
    $: if (team.timeoutsLeft < 0) { // Teams can't have negative timeouts and there might be some weird display problems
        team.timeoutsLeft = 0;
    }
    $: if (team.timeoutsLeft > team.timeoutsMax) {  // Teams can't have more penalties left than they can ever have
        team.timeoutsLeft = team.timeoutsMax;
    }

    /** Sets the team's penalty and cancels any other ongoing flags */
    function handleFlagChange(event: any) {
        setFlag(false);
        team.flag = (<HTMLInputElement>event.target).value;
    }

    /** Toggles our possession and clears the other team's */
    function setMyPossession() {
        let hadPossession = team.possession;
        clearPossession();
        team.possession = !hadPossession;
    }
</script>

<h5>{team.name}</h5>
<span class="form-label">Score</span>
<div class="input-group mb-3"> <!-- Score Group -->
    <input
        type="number"
        class="form-control"
        min="0"
        bind:value={team.score}
    />

    <!-- Quick Score Buttons -->
    <button
        class="btn btn-outline-secondary"
        on:click={()=>{team.score += 1}}
    >+1</button>
    <button
        class="btn btn-outline-secondary"
        on:click={()=>{team.score += 2}}
    >+2</button>
    <button
        class="btn btn-outline-secondary"
        on:click={()=>{team.score += 3}}
    >+3</button>
    <button
        class="btn btn-outline-secondary"
        on:click={()=>{team.score += 6}}
    >+6</button>
</div>
{#if team.timeoutsMax}  <!-- If timeouts enabled -->
    <span class="form-label">Timeouts Left</span>
    <div class="input-group mb-3">
        <!-- Timeout used quick button -->
        <button
            class="btn btn-outline-secondary"
            on:click={()=>{team.timeoutsLeft -= 1}}
        >-1</button>

        <input
            type="number"
            class="form-control"
            min="0"
            max={team.timeoutsMax}
            bind:value={team.timeoutsLeft}
        />
    </div>
{/if}
<span class="form-label">Flag</span>
<div class="input-group mb-3">
    <input
        type="text"
        class="form-control"
        placeholder="Penalty"
        value={team.flag || ''}
        on:change={handleFlagChange}
    >

    <button
        class="btn btn-outline-secondary"
        on:click={()=>{setFlag(false)}}
    >Clear</button>
</div>

<button
    class="btn mb-1"
    class:btn-primary={team.possession}
    class:btn-outline-primary={!team.possession}
    on:click={setMyPossession}
>{team.possession ? 'Clear ' : ''}Possession</button>