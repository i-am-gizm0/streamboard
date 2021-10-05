<script lang="ts">
    import {
        Button,
        Card,
        CardBody,
        CardTitle,
        Col,
        FormGroup,
        Input,
        InputGroup,
        Label
    } from 'sveltestrap';
    import type { HockeyState, Team, Penalty as PenaltyData } from '../../../games/hockey';
    import type { RecursivePartial } from '../../../SharedUtilities';
    import Penalty from './Penalty.svelte';
    

    export let team: Team;

    export let partialStateUpdate: (state: RecursivePartial<HockeyState>) => void;
    export let teamType: 'home' | 'away';

    function updateScore(e: InputEvent) {
        partialStateUpdate({
            [teamType]: {
                score: (<HTMLInputElement> e.target).valueAsNumber
            }
        });
    }

    function incrementScore() {
        partialStateUpdate({
            [teamType]: {
                score: team.score + 1
            }
        });
    }

    function addPenalty(penalty: PenaltyData) {
        console.trace('add', penalty);
        team.penalties.push(penalty);
        partialStateUpdate({
            [teamType]: {
                penalties: team.penalties
            }
        });
    }

    function removePenalty(penalty: PenaltyData) {
        team.penalties = team.penalties.filter(p => p.id !== penalty.id);
        // console.trace('remove', penalty, team.penalties);
        partialStateUpdate({
            [teamType]: {
                penalties: team.penalties
            }
        });
        // console.log(team.penalties);
        window.dispatchEvent(new CustomEvent('penaltyExpire'));
    }

    function updatePenalty(penalty: PenaltyData, index: number) {
        if (penalty.remainingTime <= 0) {
            removePenalty(penalty);
        } else {
            team.penalties[index] = penalty;
            partialStateUpdate({
                [teamType]: {
                    penalties: team.penalties
                }
            });
        }
    }

    window.addEventListener('clockStopped', () => {
        team.penalties = team.penalties.filter(p => p.remainingTime && p.remainingTime > 0);
        partialStateUpdate({
            [teamType]: {
                penalties: team.penalties
            }
        });
    });
</script>

<Col xs=12 md=6 lg=4 class="mt-3">
    <Card>
        <div class="card-header" style="background-color: {team.color}0f">
            <CardTitle>{team.name}</CardTitle>
        </div>
        <CardBody>
            <FormGroup>
                <Label for="score">Score</Label>
                <InputGroup>
                    <Input type="number" id="score" min=0 value={team.score} on:input={updateScore} />
                    <Button color=primary on:click={incrementScore}>+1</Button>
                </InputGroup>
            </FormGroup>
            <FormGroup>
                <Label>Penalties</Label>
                    {#key team.penalties.length}
                        <Penalty type="new" action={addPenalty} index={-1} />
                    {/key}
                    {#each team.penalties as penalty, index (penalty.id)}
                        <Penalty penalty={penalty} {index} action={removePenalty} updateAction={updatePenalty} />
                    {/each}
            </FormGroup>
        </CardBody>
    </Card>
</Col>
