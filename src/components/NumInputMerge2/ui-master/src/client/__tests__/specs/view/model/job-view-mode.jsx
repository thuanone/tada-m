import { countInstances } from '../../../../view/model/job-view-model';

describe('countInstances', () => {
    it('returns the correct number of instances based on arrayspec', ()=> {
        expect(countInstances("1")).toEqual(1);
        expect(countInstances("1,3")).toEqual(2);
        expect(countInstances("1-3")).toEqual(3);
        expect(countInstances("1,2,3-6")).toEqual(6);
        expect(countInstances("1-2,3,5-7")).toEqual(6);
        expect(countInstances(undefined)).toEqual(undefined);
    });
});