import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { DataService } from './data.service';

@Controller()
export class DataController {
  constructor(private readonly data: DataService) {}

  @Get('today')
  today() {
    return this.data.today();
  }

  @Post('logs')
  addLog(@Body() body: Record<string, unknown>) {
    return this.data.addLog(body);
  }

  @Get('plan/current')
  currentPlan() {
    return this.data.currentPlan();
  }

  @Post('plan/drafts')
  newDraft() {
    return this.data.newDraft();
  }

  @Post('plan/:id/confirm')
  @HttpCode(200)
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.data.confirmPlan(id);
  }

  @Put('tasks/:id')
  updateTask(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.data.updateTask(id, body);
  }

  @Get('goals')
  goals() {
    return this.data.goals();
  }

  @Post('goals')
  addGoal(@Body() body: Record<string, unknown>) {
    return this.data.addGoal(body);
  }

  @Get('documents')
  documents() {
    return this.data.documents();
  }

  @Post('documents')
  addDocument(@Body() body: Record<string, unknown>) {
    return this.data.addDocument(body);
  }

  @Delete('documents/:id')
  deleteDocument(@Param('id', ParseIntPipe) id: number) {
    return this.data.deleteDocument(id);
  }

  @Get('reports')
  reportWeeks() {
    return this.data.reportWeeks();
  }

  @Get('reports/:start')
  report(@Param('start') start: string) {
    return this.data.report(start);
  }

  @Post('reports/:start/generate')
  @HttpCode(200)
  generate(@Param('start') start: string) {
    return this.data.report(start, true);
  }

  @Post('suggestions/:id/decision')
  @HttpCode(200)
  decide(@Param('id', ParseIntPipe) id: number, @Body() body: { decision?: unknown }) {
    return this.data.decideSuggestion(id, body?.decision);
  }

  @Get('profile')
  profile() {
    return this.data.profile();
  }

  @Post('profile')
  saveProfile(@Body() body: Record<string, unknown>) {
    return this.data.saveProfile(body);
  }
}
