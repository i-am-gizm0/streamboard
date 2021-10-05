<script lang="ts">
    import {
        Button,
        Card,
        CardBody,
        CardHeader,
        CardTitle,
        Col,
        Form,
        FormGroup,
        Input,
        InputGroup,
        InputGroupText,
        Label,
        Row,
    } from 'sveltestrap';

    import type { HockeyState } from '../../../games/hockey';
    import { parseTimeString, timeToString } from '../../../SharedUtilities';
    import type { RecursivePartial } from '../../../SharedUtilities';
    import Team from './MainTeam.svelte';

    export let state: HockeyState;
    export let partialStateUpdate: (state: RecursivePartial<HockeyState>) => void;
    export let customUpdate: (event: string, data: unknown) => void;
    export let registerCustomUpdateListener: (event: string, callback: (data: unknown) => any) => void;

    function localPartialStateUpdate(newState: RecursivePartial<HockeyState>) {
        state.time.time = currentTime;
        partialStateUpdate(newState);
    }

    let timer: number;
    $: currentTime = state.time.time;

    function toggleClock() {
        localPartialStateUpdate({
            time: {
                time: currentTime,
                custom: ''
            },
        });
        if (timer) {
            stopTime(timer != -1);
        } else {
            customUpdate('startTime', {});
            // @ts-ignore
            timer = setInterval(() => {
                if (currentTime <= 0) {
                    stopTime();
                    return;
                }
                customUpdate('clockTick', currentTime = Math.round(currentTime * 10 - 1) / 10);
                window.dispatchEvent(new CustomEvent('clockTick'));
            }, 100);
        }
    }
    function stopTime(alreadySentUpdate = false, sendUpdate = true) {
        if (sendUpdate) {
            customUpdate('stopTime', {});
        }
        clearInterval(timer);
        timer = undefined;
        if (!alreadySentUpdate) {
            localPartialStateUpdate({
                time: {
                    time: currentTime,
                    custom: ''
                },
            });
        }
        window.dispatchEvent(new CustomEvent('clockStopped', { detail: currentTime }));
    }

    registerCustomUpdateListener('startTime', () => {
        timer = -1;
    });

    registerCustomUpdateListener('stopTime', () => {
        if (timer != -1) {
            stopTime(false, false);
        } else {
            timer = undefined;
        }
    });

    registerCustomUpdateListener('clockTick', (data: number) => {
        currentTime = data;
        window.dispatchEvent(new CustomEvent('clockTick'));
    });

    function changeTime(e: FocusEvent) {
        localPartialStateUpdate({
            time: {
                time: parseTimeString((<HTMLInputElement>e.target).value),
                custom: ''
            },
        });
    }

    function changePeriod(e: InputEvent) {
        localPartialStateUpdate({
            time: {
                period: parseInt((<HTMLInputElement>e.target).value),
                custom: ''
            },
        });
    }

    function incrementPeriod() {
        localPartialStateUpdate({
            time: {
                period: state.time.period + 1,
                time: state.config.periodLength,
                custom: ''
            },
        });
    }

    function setCustomTime(e: FocusEvent) {
        localPartialStateUpdate({
            time: {
                custom: (<HTMLInputElement>e.target).value,
            },
        });
    }

    function customTime(text: string) {
        localPartialStateUpdate({
            time: {
                custom: text,
            },
        });
    }

    window.addEventListener('penaltyExpire', () => {
        localPartialStateUpdate({
            time: state.time
        });
    })
</script>

<Row>
    <Col md=12 lg=4 class="mt-3">
        <Card>
            <CardHeader>
                <CardTitle>Clock</CardTitle>
            </CardHeader>
            <CardBody>
                <FormGroup>
                    <Label for="time">Time</Label>
                    <InputGroup>
                        <Input type="text" id="time" value={timeToString(currentTime)} on:blur={changeTime} />
                        <InputGroupText>
                            <Button
                                color={timer ? 'danger' : 'success'}
                                disabled={state.time.time <= 0}
                                on:click={toggleClock}
                            >
                                {timer ? 'Stop' : 'Start'} Clock
                            </Button>
                        </InputGroupText>
                    </InputGroup>
                </FormGroup>
                <FormGroup>
                    <Label for="period">Period</Label>
                    <InputGroup>
                        <Input type="number" id="period" min=0 value={state.time.period} on:input={changePeriod} />
                        <Button
                            outline={state.time.time > 0}
                            color=primary
                            on:click={incrementPeriod}
                        >+1</Button>
                    </InputGroup>
                </FormGroup>
                <FormGroup>
                    <Label for="custom">Custom</Label>
                    <InputGroup>
                        <Button
                            outline
                            color='primary'
                            disabled={state.time.custom === ''}
                            on:click={() => customTime('')}
                        >
                            Clear
                        </Button>
                        <Input type="text" id="custom" value={state.time.custom} on:blur={setCustomTime} />
                        <Button
                            outline
                            color='warning'
                            disabled={state.time.time > 1 || (timer ? true : false)}
                            on:click={() => customTime(`End ${state.time.period != 3 ? `P${state.time.period}` : 'Reg.'}`)}
                        >
                            End {state.time.period != 3 ? 'P' : 'Reg'}
                        </Button>
                        <Button
                            outline
                            color='danger'
                            on:click={() => customTime('Final')}
                        >
                            Final
                        </Button>
                    </InputGroup>
                </FormGroup>
            </CardBody>
        </Card>
    </Col>
    <Team team={state.home} teamType="home" partialStateUpdate={localPartialStateUpdate} />
    <Team team={state.away} teamType="away" partialStateUpdate={localPartialStateUpdate} />
    <datalist id="penaltyDurations">
        <option value="{timeToString(state.config.minorLength)}"></option>
        <option value="{timeToString(state.config.majorLength)}"></option>
    </datalist>
</Row>