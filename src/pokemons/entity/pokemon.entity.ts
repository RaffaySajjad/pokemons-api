import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Pokemon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  health: number;

  @Column({ nullable: true })
  filePath: string;

  @Column({ type: 'jsonb', nullable: false })
  attack: { name: string; damage: number };

  @Column({ type: 'jsonb', nullable: false })
  weakness: { name: string; multiplier: number };

  @Column({ type: 'jsonb', nullable: true })
  resistance: { name: string; value: number } | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
