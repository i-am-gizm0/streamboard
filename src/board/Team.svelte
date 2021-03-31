<script lang="ts">
    import colorContrast from 'color-contrast';
    import { fade, fly } from 'svelte/transition';
    import type { Team } from "../SharedDefinitions";

    export let team: Team;
    export let align: 'left' | 'right';

    $: bgColor = team.flag ? '#fdd835' : team.color;
    $: invert = colorContrast(bgColor, '#fff') < 4.5;
</script>

<div
    class="team"
    style="background-color: {bgColor}"
    class:invert={invert}
    class:alignRight={align == 'right'}
>
    <span class="name">{team.name.toLocaleLowerCase()}</span>
    {#key team.score}
        <span
            class="score"
            in:fly={{y: 24, duration: 800}}
            out:fly={{y: -16, duration: 600}}
        >{team.score || 0}</span>
    {/key}
    {#if team.timeoutsMax}
        <div class="timeouts" transition:fade>
            {#if team.timeoutsLeft}
                <div
                    transition:fade
                    class="timeoutSlider"
                    class:top={team.timeoutsLeft == team.timeoutsMax}
                    style="height: {(team.timeoutsLeft / (team.timeoutsMax || 3)) * 100}%"
                ></div>
            {/if}
        </div>
    {/if}
    {#if team.possession}
        <div class="possession" transition:fade={{duration: 200}}></div>
    {/if}
</div>

<style>
    .team {
        position: relative;
        width: 96px;/*resized*/
        height: 108px;/*resized*/

        border-top-left-radius: var(--border-radius);
        box-shadow: inset #00000040 0 -6px 6px; /*resized*/

        transition: 0.4s;
    }

    .team.invert {
        color: var(--bg);
    }

    .team.alignRight {
        border-top-left-radius: 0;
        border-top-right-radius: var(--border-radius);
    }

    .team span {
        position: absolute;
        transform: translate(-50%, -50%);
        text-shadow: 0 6px 6px #00000040;/*resized*/
    }

    .name {
        display: block;
        top: 23%;
        left: 50%;
        width: 72px;/*resized*/
        text-overflow: clip;
        text-align: center;
        font-size: 24px;/*resized*/
        font-variant: small-caps;
        font-family: 'Roboto Condensed', sans-serif;
    }

    .score {
        top: 60%;
        left: 50%;
        font-size: 54px;/*resized*/
        font-weight: 900;
    }

    .timeouts {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);

        width: 6px; /*resized*/
        height: 84px;/*resized*/

        background-color: #eee4;
        border-radius: 0 6px 6px 0;/*resized*/
    }

    .invert .timeouts {
        filter: invert(1);
    }

    .timeoutSlider {
        position: absolute;
        bottom: 0;
        left: 0;

        width: 6px; /*resized*/

        background-color: #eee;
        border-radius: 0 6px 6px 0;/*resized*/

        box-shadow: #ffffff40 0 0 6px 0;/*resized*/

        transition: 0.4s height;
    }

    .timeoutSlider:not(.top) {
        border-top-right-radius: 3px;
    }

    .alignRight .timeouts {
        left: auto;
        right: 0;
        border-radius: 6px 0 0 6px; /*resized*/
    }

    .alignRight .timeoutSlider {
        border-radius: 6px 0 0 6px; /*resized*/
    }

    .alignRight .timeoutSlider:not(.top) {
        border-top-right-radius: 0;
        border-top-left-radius: 3px;
    }

    .possession {
        display: block;
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);

        width: 72px;/*resized*/
        height: 6px; /*resized*/

        background-color: #FFF16F;
        border-radius: 6px 6px 0 0;/*resized*/
        box-shadow: #FFF16F88 0 0 6px 0;/*resized*/
    }
</style>

